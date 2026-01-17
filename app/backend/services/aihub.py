"""
AI Hub service layer implementation.
Provides Generate Text (gentxt) and Generate Image (genimg) capabilities using the OpenAI SDK.
"""

import base64
import io
import logging
from typing import AsyncGenerator

import httpx
from core.config import settings
from openai import AsyncOpenAI
from schemas.aihub import GenImgRequest, GenImgResponse, GenTxtRequest, GenTxtResponse

logger = logging.getLogger(__name__)


class InvalidImageInputError(ValueError):
    """Raised when the provided image input cannot be parsed."""


class AIHubService:
    """AI Hub service class that wraps LLM calls based on the OpenAI SDK."""

    def __init__(self):
        if not settings.app_ai_base_url or not settings.app_ai_key:
            raise ValueError("AI service not configured. Set APP_AI_BASE_URL and APP_AI_KEY.")

        self.client = AsyncOpenAI(
            api_key=settings.app_ai_key,
            base_url=settings.app_ai_base_url.rstrip("/"),
        )

    def _convert_message(self, msg) -> dict:
        """Convert message format and support multimodal content."""
        content = msg.content
        # If content is a list (multimodal), convert it to plain dicts
        if isinstance(content, list):
            content = [item.model_dump() if hasattr(item, "model_dump") else item for item in content]
        return {"role": msg.role, "content": content}

    async def gentxt(self, request: GenTxtRequest) -> GenTxtResponse:
        """
        Generate Text API (non-streaming), supports text and image input.

        Args:
            request: Generate text request parameters.

        Returns:
            Txt2TxtResponse: generated text response.
        """
        try:
            messages = [self._convert_message(msg) for msg in request.messages]

            response = await self.client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=False,
            )

            content = response.choices[0].message.content or ""
            usage = None
            if response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }

            return GenTxtResponse(
                content=content,
                model=request.model,
                usage=usage,
            )

        except Exception as e:
            logger.error(f"gentxt error: {e}")
            raise

    async def gentxt_stream(self, request: GenTxtRequest) -> AsyncGenerator[str, None]:
        """
        Generate Text API (streaming), supports text and image input.

        Args:
            request: Generate text request parameters.

        Yields:
            str: Generated text content chunk (plain text, not JSON).
        """
        try:
            messages = [self._convert_message(msg) for msg in request.messages]

            stream = await self.client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"gentxt_stream error: {e}")
            raise

    async def _url_to_base64(self, url: str) -> str:
        """Convert an image URL to a base64 data URI."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                # Get content-type, default to png
                content_type = response.headers.get("content-type", "image/png")
                if ";" in content_type:
                    content_type = content_type.split(";")[0].strip()

                # Convert to base64 data URI
                b64_data = base64.b64encode(response.content).decode("utf-8")
                return f"data:{content_type};base64,{b64_data}"
        except Exception as e:
            logger.warning(f"Failed to convert URL to base64: {e}, returning original URL")
            return url

    @staticmethod
    def _parse_data_uri(data_uri: str) -> tuple[bytes, str]:
        """Parse a base64 data URI and return (bytes, content_type)."""
        if "," not in data_uri:
            raise InvalidImageInputError("Invalid data URI: missing ',' separator.")

        header, b64_data = data_uri.split(",", 1)
        content_type = "image/png"
        if header.startswith("data:"):
            meta = header[5:]
            # Typical header: "image/png;base64"
            if ";" in meta:
                maybe_type = meta.split(";", 1)[0].strip()
                if maybe_type:
                    content_type = maybe_type
            elif meta.strip():
                content_type = meta.strip()

        try:
            return base64.b64decode(b64_data), content_type
        except Exception as e:
            raise InvalidImageInputError("Invalid base64 data in data URI.") from e

    @staticmethod
    def _filename_from_content_type(content_type: str, name_prefix: str = "image") -> str:
        """Best-effort filename for in-memory uploads."""
        ct = (content_type or "").lower()
        ext = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/webp": "webp",
        }.get(ct, "png")
        return f"{name_prefix}.{ext}"

    async def _image_str_to_upload_file(self, image: str, name_prefix: str = "image") -> io.BytesIO:
        """
        Convert image input (base64 data URI) into an in-memory file object for uploads.

        The OpenAI `images.edit` endpoint expects multipart file uploads; we keep the API JSON-only
        by allowing clients to pass a base64 data URI, and converting it here.
        """
        image = (image or "").strip()
        if not image:
            raise InvalidImageInputError("Input image is empty.")

        if image.startswith(("http://", "https://")):
            raise InvalidImageInputError(
                "URL input is not supported for image editing. Use a base64 data URI like `data:image/png;base64,...`."
            )
        if not image.startswith("data:"):
            raise InvalidImageInputError(
                "Only base64 data URI is supported for image editing. Example: `data:image/png;base64,...`."
            )

        image_bytes, content_type = self._parse_data_uri(image)

        upload = io.BytesIO(image_bytes)
        # openai SDK uses this name for multipart filename
        upload.name = self._filename_from_content_type(content_type, name_prefix=name_prefix)  # type: ignore[attr-defined]
        return upload

    async def _image_input_to_upload_files(self, image_input: str | list[str]) -> list[io.BytesIO]:
        """
        Convert image input (single data URI or list of data URIs) into uploadable file objects.

        Some OpenAI-compatible `images/edits` implementations support multiple input images.
        """
        images = [image_input] if isinstance(image_input, str) else image_input
        if not images:
            raise InvalidImageInputError("Input image list is empty.")

        upload_files: list[io.BytesIO] = []
        for idx, img in enumerate(images):
            if not isinstance(img, str):
                raise InvalidImageInputError("Each image must be a base64 data URI string.")
            upload_files.append(await self._image_str_to_upload_file(img, name_prefix=f"image_{idx + 1}"))
        return upload_files

    async def genimg(self, request: GenImgRequest) -> GenImgResponse:
        """
        Generate Image API.

        Args:
            request: Generate image request parameters.

        Returns:
            Txt2ImgResponse: generated image response, where `images` is a list of base64 data URIs.
        """
        try:
            # If an input image is provided, use the image editing endpoint (img2img).
            if request.image:
                image_files = await self._image_input_to_upload_files(request.image)
                image_param = image_files[0] if len(image_files) == 1 else image_files
                response = await self.client.images.edit(
                    model=request.model,
                    image=image_param,
                    prompt=request.prompt,
                    size=request.size,
                    n=request.n,
                )
            else:
                response = await self.client.images.generate(
                    model=request.model,
                    prompt=request.prompt,
                    size=request.size,
                    quality=request.quality,
                    n=request.n,
                )

            revised_prompt = response.data[0].revised_prompt if response.data else None

            # Convert all URLs to base64 data URIs
            images = []
            for item in response.data:
                if item.b64_json:
                    # If the API returns base64 directly, use it as is
                    images.append(f"data:image/png;base64,{item.b64_json}")
                elif item.url:
                    # If it is a URL, download and convert it to base64
                    base64_uri = await self._url_to_base64(item.url)
                    images.append(base64_uri)

            return GenImgResponse(
                images=images,
                model=request.model,
                revised_prompt=revised_prompt,
            )

        except Exception as e:
            logger.error(f"genimg error: {e}")
            raise

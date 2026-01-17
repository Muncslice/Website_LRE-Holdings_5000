"""
Audit trigger setup for consignments and payments tables.
This would typically be executed as SQL migrations.
"""

AUDIT_TRIGGER_SQL = """
-- Create audit log function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id, created_at)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW)::text, NEW.user_id, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id, created_at)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'UPDATE', row_to_json(OLD)::text, row_to_json(NEW)::text, NEW.user_id, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id, created_at)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD)::text, '{}'::text, OLD.user_id, NOW());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for consignments table
DROP TRIGGER IF EXISTS consignments_audit_trigger ON consignments;
CREATE TRIGGER consignments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON consignments
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Create triggers for payments table
DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;
CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
"""
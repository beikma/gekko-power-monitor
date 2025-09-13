-- Insert some sample alarms to demonstrate the functionality
INSERT INTO public.system_alarms (description, alarm_type, severity, status, source_system, start_time, metadata) VALUES
('Temperature deviation detected in Room 1: 15.5°C (target: 20.0°C)', 'heating', 'medium', 'active', 'gekko', NOW() - INTERVAL '2 hours', '{"room_id": "item1", "current_temp": 15.5, "target_temp": 20.0, "deviation": 4.5}'),
('High power consumption detected: 35.2kW on meter item2', 'hardware', 'high', 'active', 'gekko', NOW() - INTERVAL '1 hour', '{"meter_id": "item2", "power_reading": 35.2, "threshold_exceeded": true}'),
('Security system status changed', 'security', 'medium', 'resolved', 'gekko', NOW() - INTERVAL '30 minutes', '{"alarm_code": "1", "status_change": "armed"}');
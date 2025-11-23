-- Trip Acceptance Mechanism - Database Migration
-- Extends the existing trip discovery system with acceptance tracking

-- Add trip acceptance tracking fields to existing trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS acceptance_deadline TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS offered_to_driver_id VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS acceptance_response_time INTEGER; -- in seconds

-- Create trip_acceptance_log table for analytics and audit
CREATE TABLE IF NOT EXISTS trip_acceptance_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(255) REFERENCES trips(id) ON DELETE CASCADE,
  driver_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'offered', 'accepted', 'declined', 'timeout'
  offered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  response_time_seconds INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timeout_duration INTEGER DEFAULT 30, -- seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_trips_acceptance_deadline 
ON trips(acceptance_deadline) 
WHERE acceptance_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_offered_driver 
ON trips(offered_to_driver_id) 
WHERE offered_to_driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_acceptance_log_trip_driver 
ON trip_acceptance_log(trip_id, driver_id);

CREATE INDEX IF NOT EXISTS idx_trip_acceptance_log_action_time 
ON trip_acceptance_log(action, offered_at);

CREATE INDEX IF NOT EXISTS idx_trip_acceptance_log_response_time 
ON trip_acceptance_log(response_time_seconds) 
WHERE response_time_seconds IS NOT NULL;

-- Add foreign key constraints with proper references
ALTER TABLE trip_acceptance_log 
ADD CONSTRAINT fk_trip_acceptance_log_trip 
FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;

ALTER TABLE trip_acceptance_log 
ADD CONSTRAINT fk_trip_acceptance_log_driver 
FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create function to clean up expired trip offers
CREATE OR REPLACE FUNCTION cleanup_expired_trip_offers()
RETURNS void AS $$
BEGIN
  -- Reset trips where acceptance deadline has passed
  UPDATE trips 
  SET 
    acceptance_deadline = NULL,
    offered_to_driver_id = NULL,
    status = CASE 
      WHEN status = 'OFFERED' THEN 'PUBLISHED'
      ELSE status
    END
  WHERE 
    acceptance_deadline IS NOT NULL 
    AND acceptance_deadline < NOW()
    AND status IN ('OFFERED', 'PUBLISHED');
    
  -- Log timeouts for analytics
  INSERT INTO trip_acceptance_log (trip_id, driver_id, action, offered_at, responded_at, response_time_seconds)
  SELECT 
    id,
    offered_to_driver_id,
    'timeout',
    acceptance_deadline - INTERVAL '30 seconds', -- Assume 30 second offer window
    NOW(),
    EXTRACT(EPOCH FROM (NOW() - (acceptance_deadline - INTERVAL '30 seconds')))::INTEGER
  FROM trips
  WHERE 
    acceptance_deadline IS NOT NULL 
    AND acceptance_deadline < NOW() 
    AND offered_to_driver_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup job (would be called by application or cron)
-- This function should be called every minute to clean up expired offers

-- Add trip status for offered state
ALTER TABLE trips 
ADD CONSTRAINT chk_trip_status_with_offered 
CHECK (status IN (
  'DRAFT', 'PUBLISHED', 'OFFERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
));

-- Create view for driver trip acceptance analytics
CREATE OR REPLACE VIEW driver_acceptance_analytics AS
SELECT 
  driver_id,
  COUNT(*) as total_offers,
  COUNT(CASE WHEN action = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN action = 'declined' THEN 1 END) as declined_count,
  COUNT(CASE WHEN action = 'timeout' THEN 1 END) as timeout_count,
  AVG(response_time_seconds) as avg_response_time_seconds,
  MIN(response_time_seconds) as fastest_response_seconds,
  MAX(response_time_seconds) as slowest_response_seconds,
  (COUNT(CASE WHEN action = 'accepted' THEN 1 END) * 100.0 / COUNT(*)) as acceptance_rate_percent
FROM trip_acceptance_log
WHERE action IN ('accepted', 'declined', 'timeout')
GROUP BY driver_id;

-- Create view for trip acceptance success rates
CREATE OR REPLACE VIEW trip_acceptance_success_rates AS
SELECT 
  trip_id,
  COUNT(*) as total_offers,
  COUNT(CASE WHEN action = 'accepted' THEN 1 END) as acceptance_count,
  COUNT(CASE WHEN action = 'declined' THEN 1 END) as decline_count,
  COUNT(CASE WHEN action = 'timeout' THEN 1 END) as timeout_count,
  MIN(offered_at) as first_offered_at,
  MAX(CASE WHEN action = 'accepted' THEN responded_at END) as accepted_at,
  EXTRACT(EPOCH FROM (
    MAX(CASE WHEN action = 'accepted' THEN responded_at END) - MIN(offered_at)
  ))::INTEGER as total_time_to_acceptance_seconds
FROM trip_acceptance_log
GROUP BY trip_id;

COMMENT ON TABLE trip_acceptance_log IS 'Tracks all driver responses to trip offers for analytics and audit';
COMMENT ON COLUMN trip_acceptance_log.action IS 'Driver response: offered, accepted, declined, timeout';
COMMENT ON COLUMN trip_acceptance_log.response_time_seconds IS 'Time taken for driver to respond in seconds';
COMMENT ON FUNCTION cleanup_expired_trip_offers() IS 'Cleans up expired trip offers and logs timeouts';
COMMENT ON VIEW driver_acceptance_analytics IS 'Driver performance metrics for trip acceptance';
COMMENT ON VIEW trip_acceptance_success_rates IS 'Trip-level acceptance success analytics';

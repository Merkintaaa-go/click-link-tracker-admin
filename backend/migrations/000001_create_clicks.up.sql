
CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    country CHAR(2),
    is_bot BOOLEAN DEFAULT FALSE,
    link_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_country ON clicks(country);
CREATE INDEX idx_clicks_is_bot ON clicks(is_bot);

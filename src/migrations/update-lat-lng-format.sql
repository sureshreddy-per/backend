-- Update lat_lng format in buyers table from hyphen to comma
UPDATE buyers
SET lat_lng = REPLACE(lat_lng, '-', ',')
WHERE lat_lng LIKE '%-%'; 
-- Add Bhubaneswar and Cuttack localities (major neighborhoods)
-- Bhubaneswar localities
INSERT INTO localities (name, latitude, longitude, city) VALUES
  -- Bhubaneswar - Central and North
  ('Nayapalli', 20.2861, 85.8145, 'Bhubaneswar'),
  ('Patia', 20.2761, 85.8345, 'Bhubaneswar'),
  ('Khandagiri', 20.2645, 85.8012, 'Bhubaneswar'),
  ('Damafuchi', 20.2545, 85.8245, 'Bhubaneswar'),
  ('Acharya Vihar', 20.2945, 85.8445, 'Bhubaneswar'),
  ('Saheed Nagar', 20.3045, 85.8245, 'Bhubaneswar'),
  ('Lingaraj Temple', 20.2345, 85.8545, 'Bhubaneswar'),
  ('Cuttack Road', 20.2745, 85.8645, 'Bhubaneswar'),
  ('Baramunda', 20.3145, 85.8345, 'Bhubaneswar'),
  ('Ranipur', 20.3245, 85.8145, 'Bhubaneswar'),
  -- Bhubaneswar - South and West
  ('Jaydev Vihar', 20.2645, 85.7945, 'Bhubaneswar'),
  ('Infocity', 20.2445, 85.8945, 'Bhubaneswar'),
  ('Bomikhal', 20.2545, 85.9045, 'Bhubaneswar'),
  ('Satya Nagar', 20.2845, 85.7745, 'Bhubaneswar'),
  ('Laxmi Sagar', 20.2945, 85.7945, 'Bhubaneswar'),
  ('Kalubahal', 20.3045, 85.8945, 'Bhubaneswar'),
  ('Tilak Nagar', 20.2545, 85.7945, 'Bhubaneswar'),
  ('Rajendra Nagar', 20.2745, 85.7745, 'Bhubaneswar'),
  ('Manorama Vihar', 20.2345, 85.8145, 'Bhubaneswar'),
  ('Dumduma', 20.3345, 85.8445, 'Bhubaneswar'),

  -- Cuttack - Central and North
  ('Badambadi', 20.4525, 85.8730, 'Cuttack'),
  ('Rajapur', 20.4625, 85.8830, 'Cuttack'),
  ('Mangalabag', 20.4725, 85.8930, 'Cuttack'),
  ('Cuttack Basti', 20.4425, 85.8930, 'Cuttack'),
  ('Buxi Bazaar', 20.4525, 85.9030, 'Cuttack'),
  ('Naya Bazaar', 20.4625, 85.9130, 'Cuttack'),
  ('Midnapore', 20.4325, 85.8630, 'Cuttack'),
  ('Jail Road', 20.4425, 85.8530, 'Cuttack'),
  ('Ranihat', 20.4725, 85.8630, 'Cuttack'),
  ('Chandi Mandir', 20.4325, 85.8730, 'Cuttack'),
  -- Cuttack - South and West
  ('Cantonment', 20.4225, 85.8430, 'Cuttack'),
  ('Baliyatra', 20.4125, 85.8530, 'Cuttack'),
  ('Jayadev Vihar', 20.4025, 85.8630, 'Cuttack'),
  ('Dhabaleswar', 20.4325, 85.9230, 'Cuttack'),
  ('Sadar Bazar', 20.4425, 85.8730, 'Cuttack'),
  ('Sultan Bazaar', 20.4525, 85.8830, 'Cuttack'),
  ('Ghat Road', 20.4625, 85.8930, 'Cuttack'),
  ('Badambadi Extension', 20.4725, 85.8630, 'Cuttack'),
  ('Narangkhala', 20.4225, 85.9030, 'Cuttack'),
  ('Purighat', 20.4525, 85.9230, 'Cuttack')
ON CONFLICT DO NOTHING;

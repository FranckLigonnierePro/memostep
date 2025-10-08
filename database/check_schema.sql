-- Script de diagnostic pour vérifier la structure actuelle de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table rooms
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;

-- 2. Vérifier si la table players existe déjà
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'players'
) as players_table_exists;

-- 3. Si la table players existe, afficher sa structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;

-- 4. Compter les rooms existantes
SELECT COUNT(*) as total_rooms FROM rooms;

-- 5. Si la colonne players existe dans rooms, compter les joueurs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rooms' 
    AND column_name = 'players'
  ) THEN
    RAISE NOTICE 'La colonne players existe dans la table rooms';
    -- Vous pouvez exécuter cette requête séparément pour voir le contenu:
    -- SELECT code, jsonb_array_length(players) as player_count FROM rooms WHERE players IS NOT NULL;
  ELSE
    RAISE NOTICE 'La colonne players n''existe PAS dans la table rooms';
  END IF;
END $$;

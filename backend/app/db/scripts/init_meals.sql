-- 1. COMMON DICTIONARIES (For all users)
-- 1a. Proteins
INSERT INTO dmt.protein_types (id, name, category) VALUES
    ('84d9ae9d-7890-40f0-b580-8ceb8cb1e813', 'Kurczak', 'Mięso białe'),
    ('07b6a1dc-7016-4143-b4b4-4b6cfbf93e6b', 'Indyk', 'Mięso białe'),
    ('5dc48810-2290-41c8-b039-79458bd47c61', 'Mięso mielone', 'Mięso czerwone'),
    ('975f355f-5fc4-4ec8-afb9-025e8e51e521', 'Schab', 'Mięso czerwone'),
    ('4a6eed04-8fb9-4e63-aae7-f1315c152f56', 'Ryba', 'Ryby')
ON CONFLICT (name) DO NOTHING;

-- 1b. Bases
INSERT INTO dmt.base_types (id, name, category) VALUES
    ('49847bcc-f49c-4b96-bf80-a356b969d90e', 'Makaron', 'Mączne'),
    ('ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Ryż', 'Zbożowe'),
    ('792c0339-4b47-4821-850b-23815b2ef11c', 'Ziemniaki', 'Warzywne'),
    ('9293c7f2-8622-4999-bd47-21ea667e4a57', 'Kasza', 'Zbożowe'),
    ('9ff96666-16e4-4e85-a7d7-559c4c90986c', 'Kopytka', 'Mączne')
ON CONFLICT (name) DO NOTHING;

-- 1c. Components (Base materials)
INSERT INTO dmt.ingredients (id, name, category, unit) VALUES
    (gen_random_uuid(), 'Cebula', 'Warzywa', 'szt'),
    (gen_random_uuid(), 'Czosnek', 'Warzywa', 'ząbek'),
    (gen_random_uuid(), 'Papryka', 'Warzywa', 'szt'),
    (gen_random_uuid(), 'Ziemniaki', 'Warzywa', 'g'),
    (gen_random_uuid(), 'Mieszanka warzyw na patelnię', 'Warzywa', 'g'),
    (gen_random_uuid(), 'Pomidory w puszce (krojone)', 'Warzywa', 'g'),
    (gen_random_uuid(), 'Fasola czerwona (puszka)', 'Warzywa', 'g'),
    (gen_random_uuid(), 'Koper', 'Warzywa', 'pęczek'),
    (gen_random_uuid(), 'Kurczak (pierś)', 'Mięso', 'g'),
    (gen_random_uuid(), 'Kurczak (udka)', 'Mięso', 'g'),
    (gen_random_uuid(), 'Mięso mielone', 'Mięso', 'g'),
    (gen_random_uuid(), 'Indyk', 'Mięso', 'g'),
    (gen_random_uuid(), 'Schab', 'Mięso', 'g'),
    (gen_random_uuid(), 'Łosoś (filet)', 'Ryby', 'g'),
    (gen_random_uuid(), 'Dorsz (filet)', 'Ryby', 'g'),
    (gen_random_uuid(), 'Ryż basmati', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Makaron Spaghetti', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Makaron Lasagne (płaty)', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Makaron Penne/Rurki', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Kasza gryczana/pęczak', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Bułka tarta', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Mąka pszenna', 'Produkty sypkie', 'g'),
    (gen_random_uuid(), 'Śmietanka 30%', 'Nabiał', 'ml'),
    (gen_random_uuid(), 'Masło', 'Nabiał', 'g'),
    (gen_random_uuid(), 'Ser żółty/Gouda', 'Nabiał', 'g'),
    (gen_random_uuid(), 'Ser Parmezan', 'Nabiał', 'g'),
    (gen_random_uuid(), 'Jajka', 'Nabiał', 'szt'),
    (gen_random_uuid(), 'Pesto zielone', 'Sosy', 'g'),
    (gen_random_uuid(), 'Pesto czerwone', 'Sosy', 'g'),
    (gen_random_uuid(), 'Sos Teriyaki', 'Sosy', 'ml'),
    (gen_random_uuid(), 'Sos słodko-kwaśny (słoik/baza)', 'Sosy', 'g'),
    (gen_random_uuid(), 'Koncentrat pomidorowy', 'Sosy', 'g'),
    (gen_random_uuid(), 'Olej', 'Tłuszcze', 'ml'),
    (gen_random_uuid(), 'Curry (przyprawa)', 'Przyprawy', 'g'),
    (gen_random_uuid(), 'Chili (przyprawa)', 'Przyprawy', 'g')
ON CONFLICT (name) DO NOTHING;

-- 2. GENERATING DISHES AND RECIPES (Full 20 items, servings per person)
DO $$
DECLARE
    uid UUID := :user_id; 
    mid UUID;
    meal_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM dmt.meals WHERE user_id = uid) INTO meal_exists;

    IF meal_exists THEN
        RAISE NOTICE 'User % already has dishes. I''m skipping generation.', uid;
    ELSE
        -- 1. Chicken curry
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', 'ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Kurczak w curry z ryżem', 'Klasyczne curry', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Ryż basmati', 70), ('Cebula', 0.25), ('Curry (przyprawa)', 3)) AS val(n, amt) ON name = val.n;

        -- 2. Lasagne
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Lasagne', 'Klasyczna lasagne bolognese', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 125), ('Makaron Lasagne (płaty)', 65), ('Pomidory w puszce (krojone)', 100), ('Ser żółty/Gouda', 40)) AS val(n, amt) ON name = val.n;

        -- 3. Pasta with green pesto
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Makaron z kurczakiem i pesto zielonym', 'Szybki obiad', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Makaron Penne/Rurki', 80), ('Pesto zielone', 45)) AS val(n, amt) ON name = val.n;

        -- 4. Spaghetti Bolognese
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Spaghetti Bolognese', 'Sos pomidorowy z ziołami', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 125), ('Makaron Spaghetti', 80), ('Pomidory w puszce (krojone)', 120), ('Czosnek', 0.5)) AS val(n, amt) ON name = val.n;

        -- 5. Pork chop
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '975f355f-5fc4-4ec8-afb9-025e8e51e521', '792c0339-4b47-4821-850b-23815b2ef11c', 'Kotlet schabowy z ziemniakami', 'Tradycyjny schab', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Schab', 150), ('Ziemniaki', 250), ('Bułka tarta', 20), ('Jajka', 0.25)) AS val(n, amt) ON name = val.n;

        -- 6. Pork loin stew
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '975f355f-5fc4-4ec8-afb9-025e8e51e521', '9293c7f2-8622-4999-bd47-21ea667e4a57', 'Gulasz ze schabem i kaszą', 'Syty gulasz wieprzowy', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Schab', 125), ('Kasza gryczana/pęczak', 70), ('Cebula', 0.5)) AS val(n, amt) ON name = val.n;

        -- 7. Tomato meatballs
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', 'ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Pulpety pomidorowe z ryżem', 'Delikatne pulpety', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 125), ('Ryż basmati', 70), ('Koncentrat pomidorowy', 15)) AS val(n, amt) ON name = val.n;

        -- 8. Rice with chicken and vegetables
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', 'ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Ryż z kurczakiem i warzywami', 'Szybki stir-fry', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Ryż basmati', 70), ('Mieszanka warzyw na patelnię', 150)) AS val(n, amt) ON name = val.n;

        -- 9. Sweet and sour noodles with chicken
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Makaron słodko-kwaśny z kurczakiem', 'Azjatycki smak', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Makaron Penne/Rurki', 80), ('Sos słodko-kwaśny (słoik/baza)', 100)) AS val(n, amt) ON name = val.n;

        -- 10. Sweet and sour noodles with minced meat
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Makaron słodko-kwaśny z mielonym', 'Azjatycki mielony', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 125), ('Makaron Penne/Rurki', 80), ('Sos słodko-kwaśny (słoik/baza)', 100)) AS val(n, amt) ON name = val.n;

        -- 11. Pasta with red pesto
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', '49847bcc-f49c-4b96-bf80-a356b969d90e', 'Makaron z kurczakiem i pesto czerwonym', 'Z suszonymi pomidorami', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Makaron Penne/Rurki', 80), ('Pesto czerwone', 45)) AS val(n, amt) ON name = val.n;

        -- 12. Minced cutlets with potatoes
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', '792c0339-4b47-4821-850b-23815b2ef11c', 'Kotlety mielone z ziemniakami', 'Klasyczne mielone', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 150), ('Ziemniaki', 250), ('Jajka', 0.25), ('Cebula', 0.25)) AS val(n, amt) ON name = val.n;

        -- 13. Rice with teriyaki chicken
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', 'ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Ryż z kurczakiem teriyaki', 'Słodki sos teriyaki', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (pierś)', 125), ('Ryż basmati', 70), ('Sos Teriyaki', 30)) AS val(n, amt) ON name = val.n;

        -- 14. Chili con carne
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '5dc48810-2290-41c8-b039-79458bd47c61', 'ed215caa-fd79-45c1-ac1c-93bebfb9f973', 'Chili con carne z ryżem', 'Ostra potrawa z fasolą', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Mięso mielone', 125), ('Ryż basmati', 70), ('Fasola czerwona (puszka)', 60), ('Pomidory w puszce (krojone)', 100)) AS val(n, amt) ON name = val.n;

        -- 15. Groats with turkey
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '07b6a1dc-7016-4143-b4b4-4b6cfbf93e6b', '9293c7f2-8622-4999-bd47-21ea667e4a57', 'Kasza z indykiem i warzywami', 'Zdrowy posiłek', false);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Indyk', 125), ('Kasza gryczana/pęczak', 70), ('Papryka', 0.3)) AS val(n, amt) ON name = val.n;

        -- 16. Roasted chicken legs (WEEKEND)
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', '792c0339-4b47-4821-850b-23815b2ef11c', 'Pieczone udka z ziemniakami', 'Chrupiące udka', true);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Kurczak (udka)', 250), ('Ziemniaki', 300), ('Czosnek', 1)) AS val(n, amt) ON name = val.n;

        -- 17. Turkey stew (WEEKEND)
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '07b6a1dc-7016-4143-b4b4-4b6cfbf93e6b', '9293c7f2-8622-4999-bd47-21ea667e4a57', 'Gulasz z indyka z kaszą', 'Lekki gulasz', true);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Indyk', 150), ('Kasza gryczana/pęczak', 70), ('Cebula', 0.5)) AS val(n, amt) ON name = val.n;

        -- 18. Salmon with potatoes (WEEKEND)
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '4a6eed04-8fb9-4e63-aae7-f1315c152f56', '792c0339-4b47-4821-850b-23815b2ef11c', 'Łosoś z ziemniakami', 'Pieczony filet z koperkiem', true);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Łosoś (filet)', 150), ('Ziemniaki', 250), ('Koper', 0.25)) AS val(n, amt) ON name = val.n;

        -- 19. Potato casserole (WEEKEND)
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '84d9ae9d-7890-40f0-b580-8ceb8cb1e813', '792c0339-4b47-4821-850b-23815b2ef11c', 'Zapiekanka ziemniaczana', 'Z serem i kurczakiem', true);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Ziemniaki', 300), ('Kurczak (pierś)', 100), ('Ser żółty/Gouda', 50)) AS val(n, amt) ON name = val.n;

        -- 20. Cod with potatoes (WEEKEND)
        mid := gen_random_uuid();
        INSERT INTO dmt.meals (id, user_id, id_protein_type, id_base_type, name, description, is_weekend_dish)
        VALUES (mid, uid, '4a6eed04-8fb9-4e63-aae7-f1315c152f56', '792c0339-4b47-4821-850b-23815b2ef11c', 'Dorsz z ziemniakami', 'Smażony lub pieczony dorsz', true);
        INSERT INTO dmt.meal_ingredients (id, id_meal, id_ingredient, base_amount)
        SELECT gen_random_uuid(), mid, id, val.amt FROM dmt.ingredients JOIN (VALUES ('Dorsz (filet)', 150), ('Ziemniaki', 250), ('Olej', 15)) AS val(n, amt) ON name = val.n;

        RAISE NOTICE 'Successfully synchronized all 20 dishes for the user %.', uid;
    END IF;
END $$;
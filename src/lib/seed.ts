import { supabaseAdmin } from "./supabase/admin";

/* ============================================================================
 *  NAME POOL — 150 first + 150 last = >300 German / European / international
 *  combinations. Cartesian combination gives ~22,500 unique full names.
 * ========================================================================== */

const FIRST_NAMES = [
  // German
  "Lena","Anna","Maren","Lea","Sofie","Greta","Hannah","Mia","Lina","Amelie",
  "Emma","Marie","Paula","Clara","Laura","Jana","Leonie","Luca","Nele","Frieda",
  "Maximilian","Paul","Leon","Felix","Jonas","Lukas","Luis","Ben","Noah","Tim",
  "Julian","Matthias","Tobias","Sebastian","Niklas","Elias","Moritz","Phillip","Finn","Jakob",
  // Italian / Spanish / Portuguese
  "Giulia","Sofia","Chiara","Martina","Alessia","Beatrice","Francesca","Valentina","Elena","Camila",
  "Lucia","Isabela","Ines","Mariana","Catarina","Joana","Leonor","Matilde","Bianca","Aurora",
  "Matteo","Leonardo","Francesco","Giovanni","Alessandro","Lorenzo","Andrea","Marco","Davide","Tommaso",
  "Joao","Rodrigo","Tiago","Diogo","Bruno","Rafael","Miguel","Pedro","Gonçalo","Henrique",
  "Mateo","Hugo","Pablo","Alvaro","Javier","Sergio","Daniel","Carlos","Adrián","Nicolás",
  // French
  "Chloé","Manon","Camille","Léa","Emma","Inès","Louise","Alice","Lucie","Juliette",
  "Lucas","Gabriel","Hugo","Louis","Nathan","Enzo","Arthur","Théo","Ethan","Maxime",
  // Dutch / Nordic
  "Fleur","Sanne","Anouk","Sophie","Lotte","Tess","Eva","Iris","Noor","Lisa",
  "Daan","Jesse","Sem","Lars","Finn","Thijs","Stijn","Milan","Tim","Sven",
  "Astrid","Ingrid","Freja","Emma","Alma","Saga","Ebba","Maja","Elsa","Agnes",
  "Axel","Oskar","Viktor","Erik","Magnus","Henrik","Anders","Lukas","Emil","Johan",
  // UK / Irish
  "Olivia","Amelia","Isla","Ava","Mia","Sophia","Charlotte","Ella","Grace","Ivy",
  "Oliver","George","Harry","Jack","Charlie","Henry","Arthur","Thomas","James","William",
  "Aoife","Saoirse","Niamh","Ciara","Roisin","Liam","Cian","Oisin","Eoin","Padraig",
];

const LAST_NAMES = [
  // German
  "Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann",
  "Schäfer","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann",
  "Braun","Krüger","Hofmann","Hartmann","Lange","Schmitt","Werner","Krause","Lehmann","Schmid",
  "Schulze","Maier","Köhler","Herrmann","König","Walter","Peters","Möller","Huber","Kaiser",
  // Italian
  "Rossi","Ferrari","Russo","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Bruno",
  "Gallo","Conti","De Luca","Mancini","Costa","Giordano","Rizzo","Lombardi","Moretti","Barbieri",
  // Spanish / Portuguese
  "García","Martínez","López","González","Rodríguez","Hernández","Pérez","Sánchez","Ramírez","Torres",
  "Flores","Díaz","Reyes","Moreno","Jiménez","Ruiz","Álvarez","Castillo","Ortega","Vargas",
  "Silva","Santos","Ferreira","Oliveira","Pereira","Sousa","Costa","Rodrigues","Martins","Carvalho",
  // French
  "Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau",
  "Simon","Laurent","Lefebvre","Michel","Roux","David","Bertrand","Fontaine","Chevalier","Morel",
  // Dutch / Belgian
  "De Jong","Jansen","De Vries","Van den Berg","Van Dijk","Bakker","Janssen","Visser","Smit","Meijer",
  "De Boer","Mulder","Bos","Dekker","Kok","Peeters","Maes","Janssens","Willems","Hermans",
  // Nordic
  "Andersson","Johansson","Karlsson","Nilsson","Eriksson","Larsson","Olsson","Persson","Svensson","Gustafsson",
  "Hansen","Nielsen","Jensen","Pedersen","Andersen","Christensen","Larsen","Sørensen","Rasmussen","Jørgensen",
  // UK / Irish
  "Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Robinson","Wright",
  "Thompson","Evans","Walker","White","Roberts","Green","Hall","Wood","Hughes","Clarke",
  "O'Brien","Murphy","Kelly","O'Sullivan","Walsh","Byrne","Ryan","O'Connor","McCarthy","Doyle",
  // Mixed international (common in Germany)
  "Yılmaz","Kaya","Demir","Öztürk","Arslan","Doğan","Koç","Aydın","Şahin","Çelik",
  "Nowak","Kowalski","Wiśniewski","Dąbrowski","Lewandowski","Wójcik","Kamiński","Kowalczyk","Zieliński","Szymański",
];

/* ============================================================================
 *  MERCHANT POOL — 300+ real German / European / international companies,
 *  tagged with category and a suggested per-transaction amount range.
 *  Amount ranges are just defaults — the UI can override with its own range.
 * ========================================================================== */

type Merchant = { name: string; category: string; min: number; max: number };

/**
 * EURO-AREA MERCHANT POOL
 *
 * The original pool was entirely German, which made every demo account look
 * like it lived in Berlin. Ridgeford banks twenty-one countries, so the
 * statement should read like it: Dutch supermarkets, Spanish rail, Italian
 * utilities, Irish pharmacies, Portuguese transit. All real operators, priced
 * in their usual local range.
 */
export const EURO_MERCHANTS: { name: string; category: string; min: number; max: number; country: string }[] = [
  // Netherlands
  { name: "Albert Heijn", category: "Groceries", min: 6, max: 84, country: "NL" },
  { name: "Jumbo", category: "Groceries", min: 5, max: 72, country: "NL" },
  { name: "NS — Nederlandse Spoorwegen", category: "Transport", min: 3, max: 48, country: "NL" },
  { name: "bol.", category: "Shopping", min: 9, max: 190, country: "NL" },
  { name: "Coolblue", category: "Shopping", min: 18, max: 640, country: "NL" },
  // France
  { name: "Carrefour", category: "Groceries", min: 7, max: 118, country: "FR" },
  { name: "Monoprix", category: "Groceries", min: 8, max: 96, country: "FR" },
  { name: "SNCF Connect", category: "Travel", min: 19, max: 210, country: "FR" },
  { name: "FNAC", category: "Shopping", min: 12, max: 340, country: "FR" },
  { name: "Boulanger", category: "Shopping", min: 24, max: 720, country: "FR" },
  { name: "EDF", category: "Bills", min: 32, max: 165, country: "FR" },
  // Spain
  { name: "Mercadona", category: "Groceries", min: 8, max: 104, country: "ES" },
  { name: "El Corte Inglés", category: "Shopping", min: 18, max: 480, country: "ES" },
  { name: "Renfe", category: "Travel", min: 14, max: 165, country: "ES" },
  { name: "Iberdrola", category: "Bills", min: 30, max: 148, country: "ES" },
  { name: "Cabify", category: "Transport", min: 6, max: 42, country: "ES" },
  // Italy
  { name: "Esselunga", category: "Groceries", min: 9, max: 112, country: "IT" },
  { name: "Coop Italia", category: "Groceries", min: 7, max: 88, country: "IT" },
  { name: "Trenitalia", category: "Travel", min: 12, max: 190, country: "IT" },
  { name: "Enel Energia", category: "Bills", min: 28, max: 152, country: "IT" },
  { name: "Autogrill", category: "Dining", min: 5, max: 34, country: "IT" },
  // Ireland
  { name: "Dunnes Stores", category: "Groceries", min: 8, max: 96, country: "IE" },
  { name: "SuperValu", category: "Groceries", min: 7, max: 84, country: "IE" },
  { name: "Boots Ireland", category: "Health", min: 6, max: 78, country: "IE" },
  { name: "Irish Rail", category: "Transport", min: 4, max: 44, country: "IE" },
  // Portugal
  { name: "Pingo Doce", category: "Groceries", min: 6, max: 78, country: "PT" },
  { name: "Continente", category: "Groceries", min: 7, max: 92, country: "PT" },
  { name: "Metro do Porto", category: "Transport", min: 2, max: 26, country: "PT" },
  { name: "EDP Comercial", category: "Bills", min: 24, max: 128, country: "PT" },
  // Belgium / Luxembourg
  { name: "Delhaize", category: "Groceries", min: 8, max: 98, country: "BE" },
  { name: "Colruyt", category: "Groceries", min: 6, max: 86, country: "BE" },
  { name: "SNCB / NMBS", category: "Transport", min: 3, max: 52, country: "BE" },
  { name: "Auchan Luxembourg", category: "Groceries", min: 9, max: 108, country: "LU" },
  // Austria
  { name: "BILLA", category: "Groceries", min: 6, max: 82, country: "AT" },
  { name: "SPAR Österreich", category: "Groceries", min: 5, max: 76, country: "AT" },
  { name: "ÖBB", category: "Travel", min: 11, max: 148, country: "AT" },
  // Greece / Cyprus / Malta
  { name: "Sklavenitis", category: "Groceries", min: 7, max: 88, country: "GR" },
  { name: "Public", category: "Shopping", min: 14, max: 380, country: "GR" },
  { name: "Alphamega", category: "Groceries", min: 8, max: 94, country: "CY" },
  { name: "GO Malta", category: "Bills", min: 18, max: 76, country: "MT" },
  // Baltics, Slovakia, Slovenia, Croatia, Finland, Bulgaria
  { name: "Rimi", category: "Groceries", min: 6, max: 78, country: "LV" },
  { name: "Maxima", category: "Groceries", min: 5, max: 72, country: "LT" },
  { name: "Selver", category: "Groceries", min: 6, max: 74, country: "EE" },
  { name: "K-Market", category: "Groceries", min: 8, max: 96, country: "FI" },
  { name: "VR Matkalla", category: "Travel", min: 12, max: 130, country: "FI" },
  { name: "Tesco Slovakia", category: "Groceries", min: 6, max: 80, country: "SK" },
  { name: "Mercator", category: "Groceries", min: 6, max: 78, country: "SI" },
  { name: "Konzum", category: "Groceries", min: 6, max: 82, country: "HR" },
  { name: "Kaufland Bulgaria", category: "Groceries", min: 5, max: 68, country: "BG" },
  // Pan-European
  { name: "Ryanair", category: "Travel", min: 24, max: 320, country: "EU" },
  { name: "Booking.com", category: "Travel", min: 58, max: 940, country: "EU" },
  { name: "FlixBus", category: "Travel", min: 8, max: 96, country: "EU" },
  { name: "IKEA", category: "Shopping", min: 14, max: 640, country: "EU" },
  { name: "Decathlon", category: "Shopping", min: 12, max: 280, country: "EU" },
  { name: "Zalando", category: "Shopping", min: 22, max: 340, country: "EU" },
  { name: "Bolt", category: "Transport", min: 4, max: 38, country: "EU" },
  { name: "Too Good To Go", category: "Dining", min: 3, max: 12, country: "EU" },
];

const MERCHANTS: Merchant[] = [
  // Groceries — German chains
  { name: "Rewe", category: "Groceries", min: 9, max: 89 },
  { name: "Rewe City", category: "Groceries", min: 6, max: 34 },
  { name: "Edeka", category: "Groceries", min: 12, max: 92 },
  { name: "Edeka Center", category: "Groceries", min: 18, max: 120 },
  { name: "Lidl", category: "Groceries", min: 8, max: 62 },
  { name: "Aldi Süd", category: "Groceries", min: 10, max: 58 },
  { name: "Aldi Nord", category: "Groceries", min: 10, max: 56 },
  { name: "Kaufland", category: "Groceries", min: 18, max: 140 },
  { name: "Netto Marken-Discount", category: "Groceries", min: 7, max: 48 },
  { name: "Penny", category: "Groceries", min: 6, max: 44 },
  { name: "Alnatura", category: "Groceries", min: 14, max: 72 },
  { name: "Denn's Biomarkt", category: "Groceries", min: 15, max: 80 },
  { name: "dm-drogerie markt", category: "Groceries", min: 4, max: 38 },
  { name: "Rossmann", category: "Groceries", min: 4, max: 36 },
  { name: "Müller Drogerie", category: "Groceries", min: 6, max: 48 },
  { name: "Bringmeister", category: "Groceries", min: 34, max: 180 },
  { name: "Flink", category: "Groceries", min: 12, max: 56 },
  { name: "Gorillas", category: "Groceries", min: 14, max: 52 },
  { name: "Albert Heijn", category: "Groceries", min: 8, max: 58 },
  { name: "Carrefour", category: "Groceries", min: 12, max: 120 },
  { name: "Monoprix", category: "Groceries", min: 10, max: 88 },
  { name: "Mercadona", category: "Groceries", min: 14, max: 110 },
  { name: "Tesco", category: "Groceries", min: 8, max: 92 },
  { name: "Sainsbury's", category: "Groceries", min: 9, max: 86 },

  // Dining
  { name: "The Barn Coffee Roasters", category: "Dining", min: 3, max: 9 },
  { name: "Bonanza Coffee", category: "Dining", min: 3, max: 10 },
  { name: "Five Elephant", category: "Dining", min: 3, max: 12 },
  { name: "Father Carpenter", category: "Dining", min: 4, max: 14 },
  { name: "Espresso House", category: "Dining", min: 3, max: 11 },
  { name: "Starbucks", category: "Dining", min: 4, max: 12 },
  { name: "Café Einstein", category: "Dining", min: 6, max: 28 },
  { name: "Mustafa's Gemüse Kebap", category: "Dining", min: 4, max: 11 },
  { name: "Curry 36", category: "Dining", min: 3, max: 10 },
  { name: "Burgermeister", category: "Dining", min: 8, max: 18 },
  { name: "Shiso Burger", category: "Dining", min: 10, max: 22 },
  { name: "Hans im Glück", category: "Dining", min: 12, max: 24 },
  { name: "Peter Pane", category: "Dining", min: 14, max: 28 },
  { name: "Vapiano", category: "Dining", min: 11, max: 24 },
  { name: "L'Osteria", category: "Dining", min: 12, max: 34 },
  { name: "Pizza Volpes", category: "Dining", min: 9, max: 22 },
  { name: "Pizza Hut", category: "Dining", min: 10, max: 30 },
  { name: "Nordsee", category: "Dining", min: 8, max: 20 },
  { name: "Dean & David", category: "Dining", min: 9, max: 18 },
  { name: "Dunkin'", category: "Dining", min: 4, max: 12 },
  { name: "McDonald's", category: "Dining", min: 5, max: 18 },
  { name: "Burger King", category: "Dining", min: 6, max: 19 },
  { name: "KFC", category: "Dining", min: 7, max: 22 },
  { name: "Subway", category: "Dining", min: 6, max: 14 },
  { name: "YamYam", category: "Dining", min: 8, max: 20 },
  { name: "District Mot", category: "Dining", min: 16, max: 52 },
  { name: "Cocolo Ramen", category: "Dining", min: 12, max: 24 },
  { name: "Zenkichi", category: "Dining", min: 28, max: 96 },
  { name: "Lavanderia Vecchia", category: "Dining", min: 42, max: 140 },
  { name: "Wolt", category: "Dining", min: 14, max: 52 },
  { name: "Lieferando", category: "Dining", min: 12, max: 48 },
  { name: "Uber Eats", category: "Dining", min: 14, max: 54 },

  // Transport
  { name: "BVG Berlin", category: "Transport", min: 2.5, max: 9.5 },
  { name: "HVV Hamburg", category: "Transport", min: 2.5, max: 10 },
  { name: "MVV München", category: "Transport", min: 3, max: 11 },
  { name: "RMV Frankfurt", category: "Transport", min: 2.5, max: 12 },
  { name: "Deutsche Bahn", category: "Transport", min: 12, max: 220 },
  { name: "DB Fernverkehr", category: "Transport", min: 29, max: 180 },
  { name: "ÖBB", category: "Transport", min: 18, max: 140 },
  { name: "SNCF Connect", category: "Transport", min: 22, max: 165 },
  { name: "Renfe", category: "Transport", min: 18, max: 130 },
  { name: "Trenitalia", category: "Transport", min: 14, max: 120 },
  { name: "Eurostar", category: "Transport", min: 62, max: 280 },
  { name: "Flixbus", category: "Transport", min: 12, max: 62 },
  { name: "Flixtrain", category: "Transport", min: 14, max: 68 },
  { name: "Uber", category: "Transport", min: 7, max: 38 },
  { name: "Bolt", category: "Transport", min: 6, max: 34 },
  { name: "Free Now", category: "Transport", min: 8, max: 40 },
  { name: "MILES Carsharing", category: "Transport", min: 9, max: 42 },
  { name: "SHARE NOW", category: "Transport", min: 8, max: 46 },
  { name: "Sixt", category: "Transport", min: 38, max: 220 },
  { name: "Europcar", category: "Transport", min: 32, max: 200 },
  { name: "Aral Tankstelle", category: "Transport", min: 22, max: 98 },
  { name: "Shell", category: "Transport", min: 24, max: 110 },
  { name: "TotalEnergies", category: "Transport", min: 22, max: 98 },
  { name: "Jet Tankstelle", category: "Transport", min: 20, max: 92 },

  // Shopping
  { name: "Zara", category: "Shopping", min: 14, max: 189 },
  { name: "H&M", category: "Shopping", min: 10, max: 120 },
  { name: "Uniqlo", category: "Shopping", min: 18, max: 140 },
  { name: "COS", category: "Shopping", min: 28, max: 220 },
  { name: "Arket", category: "Shopping", min: 24, max: 180 },
  { name: "Zalando", category: "Shopping", min: 22, max: 240 },
  { name: "About You", category: "Shopping", min: 20, max: 180 },
  { name: "ASOS", category: "Shopping", min: 18, max: 160 },
  { name: "MediaMarkt", category: "Shopping", min: 14, max: 680 },
  { name: "Saturn", category: "Shopping", min: 14, max: 620 },
  { name: "Apple Store", category: "Shopping", min: 29, max: 1599 },
  { name: "Fnac", category: "Shopping", min: 12, max: 420 },
  { name: "IKEA", category: "Shopping", min: 18, max: 380 },
  { name: "Depot", category: "Shopping", min: 8, max: 110 },
  { name: "Butlers", category: "Shopping", min: 10, max: 140 },
  { name: "Søstrene Grene", category: "Shopping", min: 4, max: 48 },
  { name: "Tiger", category: "Shopping", min: 3, max: 32 },
  { name: "Amazon", category: "Shopping", min: 4, max: 260 },
  { name: "Otto", category: "Shopping", min: 14, max: 240 },
  { name: "Manufactum", category: "Shopping", min: 28, max: 340 },
  { name: "Globetrotter", category: "Shopping", min: 22, max: 420 },
  { name: "Decathlon", category: "Shopping", min: 10, max: 180 },
  { name: "SportScheck", category: "Shopping", min: 18, max: 260 },
  { name: "Flaconi", category: "Shopping", min: 18, max: 180 },
  { name: "Douglas", category: "Shopping", min: 14, max: 160 },
  { name: "Thalia", category: "Shopping", min: 8, max: 62 },
  { name: "Hugendubel", category: "Shopping", min: 8, max: 58 },
  { name: "Waterstones", category: "Shopping", min: 8, max: 64 },
  { name: "Fnac Darty", category: "Shopping", min: 14, max: 320 },

  // Subscriptions
  { name: "Netflix", category: "Subscriptions", min: 7.99, max: 17.99 },
  { name: "Disney+", category: "Subscriptions", min: 8.99, max: 11.99 },
  { name: "Spotify", category: "Subscriptions", min: 9.99, max: 17.99 },
  { name: "Apple Music", category: "Subscriptions", min: 6.99, max: 16.99 },
  { name: "YouTube Premium", category: "Subscriptions", min: 11.99, max: 22.99 },
  { name: "iCloud+", category: "Subscriptions", min: 0.99, max: 9.99 },
  { name: "Google One", category: "Subscriptions", min: 1.99, max: 9.99 },
  { name: "Dropbox", category: "Subscriptions", min: 9.99, max: 16.99 },
  { name: "Adobe Creative Cloud", category: "Subscriptions", min: 24.99, max: 59.99 },
  { name: "Microsoft 365", category: "Subscriptions", min: 7, max: 10 },
  { name: "Notion", category: "Subscriptions", min: 8, max: 15 },
  { name: "Todoist", category: "Subscriptions", min: 3, max: 6 },
  { name: "1Password", category: "Subscriptions", min: 2.99, max: 7.99 },
  { name: "NordVPN", category: "Subscriptions", min: 3.99, max: 12.99 },
  { name: "Substack", category: "Subscriptions", min: 5, max: 20 },
  { name: "Medium", category: "Subscriptions", min: 5, max: 5 },
  { name: "DAZN", category: "Subscriptions", min: 9.99, max: 39.99 },
  { name: "Sky Deutschland", category: "Subscriptions", min: 17.50, max: 45 },
  { name: "Audible", category: "Subscriptions", min: 9.95, max: 9.95 },

  // Bills / Utilities
  { name: "Vodafone Deutschland", category: "Bills", min: 22, max: 82 },
  { name: "Deutsche Telekom", category: "Bills", min: 24, max: 94 },
  { name: "1&1", category: "Bills", min: 14, max: 68 },
  { name: "O2", category: "Bills", min: 14, max: 62 },
  { name: "Congstar", category: "Bills", min: 8, max: 28 },
  { name: "E.ON", category: "Bills", min: 40, max: 220 },
  { name: "Vattenfall", category: "Bills", min: 48, max: 240 },
  { name: "EnBW", category: "Bills", min: 44, max: 220 },
  { name: "Stadtwerke München", category: "Bills", min: 60, max: 180 },
  { name: "Berliner Wasserbetriebe", category: "Bills", min: 18, max: 65 },
  { name: "GEZ Rundfunkbeitrag", category: "Bills", min: 18.36, max: 18.36 },
  { name: "Allianz Versicherung", category: "Bills", min: 28, max: 180 },
  { name: "HUK-Coburg", category: "Bills", min: 24, max: 160 },
  { name: "AOK", category: "Bills", min: 180, max: 740 },
  { name: "Techniker Krankenkasse", category: "Bills", min: 180, max: 720 },
  { name: "DKB Immobilien", category: "Bills", min: 420, max: 1850 },

  // Housing / Rent
  { name: "Deutsche Wohnen", category: "Housing", min: 620, max: 1850 },
  { name: "Vonovia", category: "Housing", min: 680, max: 1720 },
  { name: "Mietkaution Deposit", category: "Housing", min: 1200, max: 3600 },

  // Travel
  { name: "Lufthansa", category: "Travel", min: 89, max: 720 },
  { name: "Eurowings", category: "Travel", min: 48, max: 320 },
  { name: "Condor", category: "Travel", min: 110, max: 620 },
  { name: "Ryanair", category: "Travel", min: 24, max: 220 },
  { name: "easyJet", category: "Travel", min: 32, max: 260 },
  { name: "KLM", category: "Travel", min: 98, max: 540 },
  { name: "Air France", category: "Travel", min: 98, max: 620 },
  { name: "British Airways", category: "Travel", min: 112, max: 680 },
  { name: "Iberia", category: "Travel", min: 72, max: 420 },
  { name: "Swiss International", category: "Travel", min: 140, max: 720 },
  { name: "Booking.com", category: "Travel", min: 58, max: 520 },
  { name: "Airbnb", category: "Travel", min: 68, max: 620 },
  { name: "Hotels.com", category: "Travel", min: 62, max: 520 },
  { name: "Expedia", category: "Travel", min: 82, max: 720 },
  { name: "GetYourGuide", category: "Travel", min: 18, max: 180 },
  { name: "Kayak", category: "Travel", min: 62, max: 620 },

  // Entertainment
  { name: "CineStar", category: "Entertainment", min: 9, max: 22 },
  { name: "UCI Kinowelt", category: "Entertainment", min: 9, max: 22 },
  { name: "Cinemaxx", category: "Entertainment", min: 10, max: 24 },
  { name: "Steam", category: "Entertainment", min: 6, max: 79 },
  { name: "PlayStation Store", category: "Entertainment", min: 8, max: 89 },
  { name: "Nintendo eShop", category: "Entertainment", min: 10, max: 69 },
  { name: "Epic Games", category: "Entertainment", min: 6, max: 79 },
  { name: "Eventim", category: "Entertainment", min: 22, max: 180 },
  { name: "Ticketmaster", category: "Entertainment", min: 22, max: 220 },
  { name: "Berghain", category: "Entertainment", min: 18, max: 25 },
  { name: "Watergate", category: "Entertainment", min: 15, max: 22 },
  { name: "Elbphilharmonie", category: "Entertainment", min: 28, max: 120 },
  { name: "Staatsoper Berlin", category: "Entertainment", min: 28, max: 160 },

  // Health
  { name: "McFit", category: "Health", min: 19.90, max: 39.90 },
  { name: "FitX", category: "Health", min: 19.90, max: 29.90 },
  { name: "Urban Sports Club", category: "Health", min: 29, max: 119 },
  { name: "ClassPass", category: "Health", min: 45, max: 129 },
  { name: "Apotheke am Markt", category: "Health", min: 6, max: 48 },
  { name: "DocMorris", category: "Health", min: 8, max: 62 },
  { name: "Shop-Apotheke", category: "Health", min: 8, max: 68 },
  { name: "Fielmann", category: "Health", min: 39, max: 420 },
  { name: "Apollo Optik", category: "Health", min: 42, max: 380 },
];

/* Extra incoming payer pool — random people/companies that "send you money" */
const INCOMING_PAYERS = [
  "Acme GmbH", "Bold & Co", "Creative Labs", "Dexter Solutions", "Ember Studio",
  "Ferris Consulting", "Globex AG", "Helix Labs", "Initech", "Joist Studio",
  "Keystone Partners", "Lumen Works", "Meridian Group", "Nordwind GmbH", "Oberon Ltd",
  "Panorama Studio", "Quartz Agency", "Riverside Dev", "Saphire Ltd", "Terra Group",
  "Umbra Labs", "Vertex Studio", "Willow Co", "Xenon Works", "Yonder Agency",
  "Your Employer GmbH", "Employer AG", "Müller Consulting", "Schmidt & Partner", "Weber GmbH",
  "Berlin Brand Studio", "Hamburg Digital", "Münchner Werkstatt", "Köln Creative", "Frankfurt Finanz",
];

/* ============================================================================
 *  Utilities
 * ========================================================================== */

export function randomPersonName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function round2(n: number) { return Math.round(n * 100) / 100; }

function randomDateBetween(startIso: string, endIso: string) {
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  const t = s + Math.random() * (e - s);
  const d = new Date(t);
  // scatter the hour a bit
  d.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));
  return d.toISOString();
}

/* ============================================================================
 *  Public API — generate transactions with full control
 * ========================================================================== */

export type SeedOptions = {
  /** Direction: 'sent' = debits only, 'received' = credits only, 'both' = mix */
  direction?: "sent" | "received" | "both";
  /** How many to create */
  count?: number;
  /** Range of each transaction amount (EUR). Default depends on direction. */
  minAmount?: number;
  maxAmount?: number;
  /** Date range (ISO strings). If omitted, defaults to last 30 days. */
  from?: string;
  to?: string;
  /** Optional: restrict to certain categories */
  categories?: string[];
  /** Which account the transactions land on */
  accountType?: "checking" | "savings";
};

export type TxnRow = {
  user_id: string;
  account_type: "checking" | "savings";
  direction: "debit" | "credit";
  amount: number;
  currency: string;
  rail: string;
  category: string;
  counterparty_name: string;
  description?: string;
  merchant?: string;
  created_at: string;
  status: "posted";
};

export function generateTransactions(userId: string, opts: SeedOptions = {}): TxnRow[] {
  const direction = opts.direction ?? "both";
  const count = Math.min(Math.max(opts.count ?? 40, 1), 2000);
  const to = opts.to || new Date().toISOString();
  const from = opts.from || new Date(Date.now() - 30 * 86400000).toISOString();
  const accountType = opts.accountType ?? "checking";
  const minA = opts.minAmount ?? (direction === "received" ? 50 : 5);
  const maxA = opts.maxAmount ?? (direction === "received" ? 2500 : 250);

  // Filter merchants by requested categories (debits)
  const ALL_MERCHANTS: Merchant[] = [
    ...MERCHANTS,
    ...EURO_MERCHANTS.map(({ name, category, min, max }) => ({ name, category, min, max })),
  ];
  const debitPool = opts.categories && opts.categories.length
    ? ALL_MERCHANTS.filter((m) => opts.categories!.includes(m.category))
    : ALL_MERCHANTS;
  const pool = debitPool.length > 0 ? debitPool : ALL_MERCHANTS;

  const rows: TxnRow[] = [];
  for (let i = 0; i < count; i++) {
    const isDebit =
      direction === "sent" ? true :
      direction === "received" ? false :
      Math.random() < 0.78;

    const amt = round2(minA + Math.random() * Math.max(0.01, maxA - minA));
    const created_at = randomDateBetween(from, to);

    if (isDebit) {
      const m = pick(pool);
      rows.push({
        user_id: userId,
        account_type: accountType,
        direction: "debit",
        amount: amt,
        currency: "EUR",
        rail: "card",
        category: m.category,
        counterparty_name: m.name,
        merchant: m.name,
        description: m.name,
        created_at,
        status: "posted",
      });
    } else {
      // 50/50 salary-like vs peer transfer
      const isSalary = Math.random() < 0.25;
      if (isSalary) {
        const employer = pick(INCOMING_PAYERS);
        rows.push({
          user_id: userId,
          account_type: accountType,
          direction: "credit",
          amount: amt,
          currency: "EUR",
          rail: "salary",
          category: "Salary",
          counterparty_name: employer,
          merchant: employer,
          description: "Salary",
          created_at,
          status: "posted",
        });
      } else {
        const person = randomPersonName();
        rows.push({
          user_id: userId,
          account_type: accountType,
          direction: "credit",
          amount: amt,
          currency: "EUR",
          rail: "sepa_instant",
          category: "Transfer",
          counterparty_name: person,
          merchant: person,
          description: "Incoming transfer",
          created_at,
          status: "posted",
        });
      }
    }
  }

  return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Called once at signup — a sane 30-day "lived-in" starter. */
export async function seedInitialTransactionsForUser(userId: string) {
  const rows = generateTransactions(userId, { direction: "both", count: 28, minAmount: 4, maxAmount: 320 });
  // Add one salary explicitly
  const to = new Date();
  const salaryDate = new Date(to);
  salaryDate.setDate(to.getDate() - 18);
  rows.push({
    user_id: userId,
    account_type: "checking",
    direction: "credit",
    amount: 3200,
    currency: "EUR",
    rail: "salary",
    category: "Salary",
    counterparty_name: "Your Employer GmbH",
    merchant: "Your Employer GmbH",
    description: "Monthly salary",
    created_at: salaryDate.toISOString(),
    status: "posted",
  });
  const sb = supabaseAdmin();
  await sb.from("transactions").insert(rows);
}

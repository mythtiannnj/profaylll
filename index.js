const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---- Load config ----
const CONFIG_PATH = path.join(__dirname, 'config.json');
let CONFIG = {};
try {
  CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  console.log('✓ Loaded config.json');
} catch (e) {
  console.error('✗ config.json error:', e.message);
  process.exit(1);
}

app.use(express.json({ limit: '128kb' }));

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ============================================================
//  Agriculture facts pool — 210 facts
// ============================================================
const AGRI_FACTS = [
  // ---- Global & General (1–20) ----
  "Agriculture employs over 1 billion people worldwide — about 1 in 3 workers.",
  "Farming is one of the oldest professions — dating back over 10,000 years.",
  "Around 40% of the world's food is produced by small-scale farmers.",
  "Over 2,000 plant species have been used by humans for food, but only 200 dominate global agriculture.",
  "Agriculture is the world's largest employer, especially in developing nations.",
  "The 'Green Revolution' of the 1960s doubled food production in developing countries.",
  "About 1 in 9 people worldwide still experience food insecurity.",
  "Only 3% of the world's water is freshwater, and 70% of that is used for agriculture.",
  "Global food production must increase by 70% by 2050 to feed a growing population.",
  "Women make up about 43% of the agricultural labor force in developing countries.",
  "Smallholder farms supply up to 80% of the food consumed in sub-Saharan Africa.",
  "The world produces enough food to feed everyone — hunger is a distribution problem, not a scarcity one.",
  "About 1/3 of all food produced globally is wasted — roughly 1.3 billion tons per year.",
  "A typical farmer today feeds about 155 people, compared to 26 in 1960.",
  "Roughly 570 million farms exist worldwide, and 90% are family-run.",
  "Only 10 crops provide about 75% of the world's food energy intake.",
  "Global agricultural land covers about 5 billion hectares — half of habitable land.",
  "Roughly 1 in 5 calories consumed worldwide comes from rice alone.",
  "Food production accounts for about 26% of global greenhouse gas emissions.",
  "The FAO estimates that 40% of the world's agricultural land is degraded.",

  // ---- Rice (21–40) ----
  "Rice feeds more than half of the world's population, making it the most consumed staple grain.",
  "It takes about 2,500 liters of water to grow just 1 kilogram of rice.",
  "The Philippines grows over 100 varieties of rice, from upland to lowland.",
  "The Philippines is the 8th largest rice producer in the world.",
  "Rice paddies create artificial wetlands that support frogs, fish, and birds.",
  "Rice was first domesticated in the Yangtze River basin of China around 9,000 years ago.",
  "A single rice plant can produce up to 3,000 grains.",
  "Asia produces and consumes about 90% of the world's rice.",
  "Rice is grown on every continent except Antarctica.",
  "Upland rice is grown without flooding — it relies on rain instead of irrigation.",
  "IR8 — the 'miracle rice' — helped save millions from famine in the 1960s.",
  "The Philippines' Rice Tariffication Law of 2019 removed import quotas on rice.",
  "Banaue Rice Terraces in the Philippines are over 2,000 years old.",
  "A rice paddy can absorb up to 10 times more water than a dry field.",
  "Golden Rice was engineered to contain beta-carotene (vitamin A).",
  "Rice straw is used for paper, animal feed, and mushroom cultivation.",
  "Rice bran contains healthy oils and is used in cooking and cosmetics.",
  "One hectare of rice can produce around 4 to 6 tons of grain per season.",
  "Rice is a symbol of life, fertility, and prosperity in many Asian cultures.",
  "The Latin name for Asian rice is Oryza sativa.",

  // ---- Corn / Maize (41–55) ----
  "Corn (maize) is grown on every continent except Antarctica.",
  "Corn was first domesticated in southern Mexico about 9,000 years ago.",
  "Every ear of corn has an even number of rows — usually 16.",
  "A single corn plant produces about 1 million pollen grains.",
  "The US is the world's largest corn producer.",
  "Corn is used in over 4,000 products — from fuel to food to plastics.",
  "Popcorn was eaten by Native Americans over 5,000 years ago.",
  "Corn is technically a grain, a fruit, and a vegetable — all at once.",
  "One bushel of corn can sweeten over 400 cans of soda.",
  "Corn silk has one strand for every kernel on the cob.",
  "Sweet corn has more sugar than field corn.",
  "Corn ethanol is blended into about 10% of US gasoline.",
  "Maize is called 'corn' only in the US, Canada, and Australia.",
  "The tallest corn plant ever recorded grew over 35 feet tall.",
  "Corn needs about 60 cm of water to produce one bushel of grain.",

  // ---- Coconut (56–70) ----
  "Coconut trees can produce fruit for up to 100 years.",
  "The Philippines is one of the world's top 5 producers of coconuts.",
  "Leyte is one of the Philippines' top coconut-producing provinces.",
  "A single coconut palm can yield up to 75 coconuts per year.",
  "Coconut water is naturally sterile and was used as an IV drip during WWII.",
  "Coconut oil has a high smoke point — great for cooking.",
  "Coir (coconut husk fiber) is used in ropes, mats, and soil erosion control.",
  "The Philippines produces around 15 million tons of coconuts each year.",
  "Coconut palms start bearing fruit around 5 to 6 years old.",
  "Copra — dried coconut meat — is the main source of coconut oil.",
  "Coconut sugar is made from the sap of coconut flowers.",
  "Coconut shells can be turned into activated carbon for water filters.",
  "Filipino 'buko' refers to young, green coconut.",
  "Coconut milk is not the same as coconut water — one comes from the meat.",
  "The coconut is not a true nut — it's a drupe (a fibrous one-seeded fruit).",

  // ---- Coffee (71–85) ----
  "Coffee was first discovered in Ethiopia by a goat herder named Kaldi.",
  "Coffee is the second most traded commodity in the world after oil.",
  "It takes about 4,000 coffee beans to make 1 kilogram of roasted coffee.",
  "Coffee trees take 3 to 4 years before they produce their first harvest.",
  "Brazil has been the world's largest coffee producer for over 150 years.",
  "The Philippines is one of the few countries producing all 4 commercial coffee varieties.",
  "Arabica coffee is prized for its smooth, aromatic flavor.",
  "Robusta coffee has roughly twice the caffeine of Arabica.",
  "Coffee beans are actually the seeds of the coffee cherry fruit.",
  "Light roasts have slightly more caffeine than dark roasts.",
  "The word 'coffee' comes from the Arabic 'qahwah'.",
  "Espresso was invented in Italy in the early 1900s.",
  "A single coffee tree yields about 1 pound of roasted coffee per year.",
  "Coffee is grown in over 50 countries, mostly in the 'Bean Belt'.",
  "Civet coffee (kopi luwak) is one of the world's most expensive coffees.",

  // ---- Fruits & Vegetables (86–110) ----
  "Bananas are technically berries, but strawberries are not.",
  "Tomatoes are botanically fruits but legally classified as vegetables in the US.",
  "Avocados are fruits, and they contain more potassium than bananas.",
  "Mangoes are the most consumed fruit in the world.",
  "The Philippines is the world's 3rd largest banana producer.",
  "One pili nut tree can produce fruit for over 100 years.",
  "A single strawberry has about 200 seeds on its outer surface.",
  "Pineapples take 2 years to grow and each plant produces only one fruit.",
  "The world's heaviest pumpkin weighed over 1,200 kilograms.",
  "The Moringa tree is called the 'miracle tree' for its nutritional value.",
  "Malunggay (moringa) leaves have 7x the vitamin C of oranges.",
  "A single mango tree can produce over 1,000 fruits in a year.",
  "Durian is banned in many public places in Southeast Asia for its smell.",
  "Lychees are native to southern China and are related to rambutan.",
  "The world's hottest chili, the Carolina Reaper, rates over 2.2 million SHU.",
  "Siling labuyo (Filipino bird's eye chili) is about 80,000–100,000 SHU.",
  "Watermelons are 92% water and are technically a berry.",
  "The heaviest watermelon ever grown weighed over 350 pounds.",
  "Sweet potatoes are not related to regular potatoes at all.",
  "Cassava (kamoteng kahoy) is a staple root crop in tropical regions.",
  "The Philippines is one of the world's top mango exporters.",
  "Calamansi is a hybrid between a kumquat and a mandarin.",
  "A single ear of sweet corn contains about 800 kernels.",
  "Bell peppers have more vitamin C than oranges.",
  "The world's largest fruit is the jackfruit — it can weigh up to 55 kg.",

  // ---- Soil (111–130) ----
  "Soil contains more living organisms in a single teaspoon than there are people on Earth.",
  "One hectare of healthy soil can store up to 2,000 tons of carbon.",
  "Soil erosion can destroy up to 75 billion tons of topsoil worldwide each year.",
  "It takes 500 years to form just 1 inch of topsoil naturally.",
  "Earthworms can eat their own body weight in soil every day.",
  "Healthy soil can hold up to 3,750 gallons of water per acre.",
  "Soil is made of minerals, organic matter, air, water, and living organisms.",
  "There are more microorganisms in a handful of soil than stars in the Milky Way.",
  "Nitrogen-fixing bacteria in soil convert atmospheric nitrogen into plant food.",
  "Mycorrhizal fungi form symbiotic relationships with 90% of land plants.",
  "Compost can improve soil water retention by up to 30%.",
  "Biochar can lock carbon in soil for hundreds or thousands of years.",
  "The world's oldest known soil is over 3 billion years old.",
  "Loam soil is the ideal mix — about 40% sand, 40% silt, 20% clay.",
  "Soil pH affects which nutrients plants can absorb.",
  "The Dust Bowl of the 1930s was caused by severe soil erosion in the US.",
  "No-till farming reduces soil erosion by up to 90%.",
  "The Philippines has about 30 soil types identified by the DA.",
  "Volcanic soil in Leyte is rich in minerals and ideal for rice.",
  "Soil is technically a non-renewable resource — it takes centuries to rebuild.",

  // ---- Bees & Pollination (131–145) ----
  "Bees pollinate 1 in every 3 bites of food we eat.",
  "A single honeybee visits 50 to 100 flowers per trip.",
  "One bee colony can pollinate 300 million flowers in a day.",
  "Bees communicate by dancing — the 'waggle dance' tells others where nectar is.",
  "It takes about 12 worker bees a whole lifetime to make one teaspoon of honey.",
  "Queen bees can lay up to 2,000 eggs per day.",
  "A bee's wings beat about 200 times per second.",
  "Honey never spoils — 3,000-year-old honey has been found in Egyptian tombs.",
  "Bees have 5 eyes: 2 compound eyes and 3 simple eyes (ocelli).",
  "Beekeeping (apiculture) is practiced worldwide, including in the Philippines.",
  "Wild pollinators contribute to over $200 billion of global food production.",
  "Butterflies, bats, and birds also pollinate crops.",
  "Without pollinators, coffee, chocolate, and almonds would largely disappear.",
  "Native stingless bees in the Philippines are called 'kiwot' or 'lukot'.",
  "Pollinator decline is a major global food security concern.",

  // ---- Livestock (146–160) ----
  "One cow can produce up to 200,000 glasses of milk in its lifetime.",
  "Cows have almost panoramic vision — nearly 360 degrees.",
  "Chickens are the most numerous birds on Earth, with over 25 billion worldwide.",
  "A dairy cow drinks about 30 to 50 gallons of water per day.",
  "Goats were the first animals domesticated by humans, about 10,000 years ago.",
  "Pigs are smarter than dogs and can be trained to do tricks.",
  "A single hen can lay up to 300 eggs per year.",
  "Ducks have waterproof feathers thanks to a special oil gland.",
  "Carabaos (water buffalo) are the traditional work animals of Filipino farmers.",
  "The Philippines has over 2.5 million carabaos, mostly in rural areas.",
  "Chickens can remember up to 100 different faces.",
  "Sheep have rectangular pupils, giving them a wide field of vision.",
  "Cows have best friends and become stressed when separated.",
  "Bees and pigs are the only animals that can recognize themselves in a mirror besides primates.",
  "A dairy cow produces about 6–7 gallons of milk per day on average.",

  // ---- Sustainable & Modern Farming (161–180) ----
  "Vertical farming uses up to 95% less water than traditional farming.",
  "Hydroponics — growing plants without soil — is over 1,000 years old.",
  "Aquaponics combines fish farming and hydroponics in a closed loop.",
  "Regenerative farming can sequester carbon and improve soil health at the same time.",
  "Precision agriculture uses GPS and drones to optimize water and fertilizer use.",
  "Agroforestry integrates trees with crops to boost biodiversity and yields.",
  "Drip irrigation saves up to 60% more water than flood irrigation.",
  "Cover crops like clover and rye reduce soil erosion and fix nitrogen.",
  "Permaculture designs farms that mimic natural ecosystems.",
  "Greenhouses extend growing seasons and protect crops from weather.",
  "Biofertilizers use living microbes instead of synthetic chemicals.",
  "Integrated farming combines crops, livestock, and aquaculture on one farm.",
  "Aeroponics grows plants with roots suspended in air, misted with nutrients.",
  "Solar-powered irrigation is bringing water to remote farms.",
  "Drone spraying is 5x faster than manual spraying.",
  "Smart sensors can detect plant disease before visible symptoms appear.",
  "Blockchain is being used to trace food from farm to table.",
  "Insect farming (crickets, mealworms) is a sustainable protein source.",
  "Kelp farming is one of the fastest-growing forms of aquaculture.",
  "Lab-grown meat could reduce agricultural land use by over 90%.",

  // ---- Grains & Others (181–195) ----
  "A single grain of wheat can produce up to 20,000 more grains when planted.",
  "Sugarcane is the world's largest crop by production volume.",
  "Wheat was first cultivated around 9,000 years ago in the Fertile Crescent.",
  "Barley is one of the oldest cultivated grains — used in beer, bread, and soup.",
  "Cassava is the third-largest source of carbohydrates in the tropics.",
  "Soybeans are the most widely grown oilseed in the world.",
  "The Philippines produces about 8 million tons of sugarcane annually.",
  "Quinoa contains all 9 essential amino acids — rare for a plant.",
  "Oats are one of the healthiest grains, rich in beta-glucan fiber.",
  "Millet is drought-resistant and grown across Africa and Asia.",
  "Buckwheat is not a wheat — it's related to rhubarb.",
  "Sorghum is the 5th most important cereal crop in the world.",
  "The Philippines is the 4th largest banana producer globally.",
  "Negros Occidental is the Philippines' top sugar-producing province.",
  "Rice and corn are the Philippines' two most important cereal crops.",

  // ---- Pests & Disease (196–205) ----
  "Plant diseases cost the global economy over $220 billion each year.",
  "Invasive pests destroy up to 40% of global food crops annually.",
  "Integrated Pest Management (IPM) reduces pesticides by up to 50%.",
  "Crop rotation is one of the oldest methods to prevent soil-borne diseases.",
  "The brown planthopper is one of the most destructive rice pests.",
  "Fall armyworm has invaded over 70 countries since 2016.",
  "Ladybugs are beneficial insects — they eat aphids and other pests.",
  "Neem oil is a natural, plant-based pesticide used for centuries.",
  "Bacillus thuringiensis (Bt) is a bacteria used as a biological pesticide.",
  "Plant quarantine prevents the spread of invasive pests across borders.",

  // ---- Agricultural Extension (206–210) ----
  "Agricultural extension workers help farmers adopt new technology and improve yields.",
  "The first formal agricultural extension program began in Ireland in 1847.",
  "Extension services reach over 500 million farmers worldwide.",
  "Agricultural extension is credited with boosting rice yields in Asia during the Green Revolution.",
  "The 4 pillars of extension are: teaching, research, demonstration, and adoption.",

  // ---- Philippines specific (211–230) ----
  "Agriculture contributes about 10% of the Philippines' GDP.",
  "The Philippines has over 5.5 million hectares of rice paddies.",
  "One-third of Filipino workers are employed in agriculture.",
  "The average Filipino farmer is around 57 years old — the sector faces an aging crisis.",
  "The Philippines is a top exporter of coconut products, bananas, and pineapple.",
  "Palay (unmilled rice) is the Philippines' most important crop.",
  "Burauen, Leyte is known for its rich volcanic soil and rice terraces.",
  "The Department of Agriculture (DA) was founded in 1898.",
  "The Philippines' 'Rice Competitiveness Enhancement Fund' supports local farmers.",
  "The 'Masagana 99' program in the 1970s aimed for rice self-sufficiency.",
  "The Philippines observes 'Farmers' and Fisherfolk's Month' every May.",
  "The Philippine Rice Research Institute (PhilRice) was established in 1985.",
  "The 'High Value Crops Development Program' promotes fruits, vegetables, and livestock.",
  "The Philippines is the world's largest exporter of coconut oil.",
  "The top 3 Philippine crops by area are rice, coconut, and corn.",
  "Central Luzon is known as the 'Rice Granary of the Philippines'.",
  "Cordillera is famous for its rice terraces, a UNESCO World Heritage Site.",
  "The Philippines has a national rice self-sufficiency target.",
  "Roughly 2.2 million Filipino farmers cultivate rice.",
  "The 'Kadiwa ni Ani at Kita' program connects farmers directly to consumers.",
];

// ============================================================
//  Public config (safe subset)
// ============================================================
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(CONFIG);
});

// ============================================================
//  Random agriculture fact API
// ============================================================
app.get('/api/agriculture-fact', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const fact = AGRI_FACTS[Math.floor(Math.random() * AGRI_FACTS.length)];
  res.json({
    success: true,
    fact,
    total: AGRI_FACTS.length,
    fetchedAt: new Date().toISOString(),
  });
});

// ============================================================
//  Page routes
// ============================================================
const pages = {
  '/':          'index.html',
  '/profile':   'profile.html',
  '/hobbies':   'hobbies.html',
  '/education': 'education.html',
  '/contact':   'contact.html',
  '/gallery':   'gallery.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
      if (err) next(err);
    });
  });
});

// ============================================================
//  404 handler
// ============================================================
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path,
    });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
    if (err) {
      res.status(404).type('html').send('<h1>404 — Not Found</h1>');
    }
  });
});

// ============================================================
//  500 handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
    });
  }
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'), (sendErr) => {
    if (sendErr) {
      res.status(500).type('html').send('<h1>500 — Server Error</h1>');
    }
  });
});

// ============================================================
//  Export + local listen
// ============================================================
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`👤 Personal website at http://localhost:${PORT}`));
}
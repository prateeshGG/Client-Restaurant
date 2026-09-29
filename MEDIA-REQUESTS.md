# Scioto House — images & video still needed (with generation prompts)

Save photos to `site/public/images/` and videos to `site/public/video/` with EXACTLY these filenames.
Once a file exists, tell me and I switch the path in `site/src/content.js` (or the owner can upload photos in the Owner Dashboard).

**Shared photo style — add to every photo prompt:**
> Editorial hospitality photography, natural warm light, real and inviting (not CGI), exposed red brick, warm oak, brass and deep green accents, shallow depth of field, high detail, no text, no letters, no logos, no people's faces (hands or back-of-head is fine).

**Shared dish style — add to every menu-dish prompt (1:1, 1200×1200 or larger):**
> Appetising restaurant food photography, 3/4 overhead angle, single plated dish centred on a speckled handmade ceramic plate on a dark oak table, soft window light from the left, shallow depth of field, a little negative space around the plate, no text, no hands, no cutlery clutter.

## A. Noir option (dark, cinematic)
| File | Format | Prompt |
|---|---|---|
| `video/noir-hero.mp4` | 16:9, 1920×1080, 8–12 s seamless loop, H.264, no audio, < 8 MB | "Slow cinematic close-ups in a candle-lit hotel bar at night: a bartender's hands pouring amber whiskey over a large ice cube, a match striking and lighting a candle, brass details glinting, deep shadows, warm amber light, shallow depth of field, gentle slow camera drift, moody luxury atmosphere, no faces, no text." |
| `images/noir-hero-poster.jpg` | 16:9 | One still frame of the video above (first frame). |
| `images/noir-exterior-night.jpg` | 16:9 | "The same restored 1890s red-brick corner hotel at night after rain, wet reflective brick street, warm glowing arched windows, black steel canopy, old street lamps, cinematic dark mood, deep blue-black sky." |
| `images/noir-room-night.jpg` | 4:3 | "Boutique hotel king room at night lit only by two brass bedside lamps, dark green velvet headboard, crisp white linen, exposed brick in shadow, intimate moody light." |
| `images/noir-dish-dark.jpg` | 1:1 | "Pan-seared walleye with brown butter on a dark stone plate under a single tight spotlight, black background, dramatic chiaroscuro food photography." |
| `images/noir-cocktail-smoke.jpg` | 4:5 | "A smoked old-fashioned cocktail under a glass cloche releasing white smoke on a black marble bar, amber backlight, dark luxurious bar." |

## B. Terra option (sun-baked, earthy)
| File | Format | Prompt |
|---|---|---|
| `video/terra-hero.mp4` | 16:9 (also works cropped 4:5), 8–12 s loop, no audio, < 8 MB | "Warm morning in a sunlit hotel: linen curtains moving gently in a breeze, sunlight across an oak table, hands tearing a warm sourdough loaf, steam rising from a ceramic coffee cup, terracotta and sand tones, slow natural handheld feel, no faces, no text." |
| `images/terra-hero-poster.jpg` | 16:9 | One still frame of the video above. |
| `images/terra-courtyard.jpg` | 4:5 | "Sunlit brick courtyard of a small hotel with potted olive trees, terracotta tile floor, linen-covered bistro table, dappled afternoon shade, warm Mediterranean-meets-Midwest feel." |
| `images/terra-bread.jpg` | 4:5 | "Close-up of floury hands holding a crusty sourdough loaf over a wooden board, flour dust in the sunlight, rustic bakery warmth." |
| `images/terra-market.jpg` | 16:9 | "Overhead of Ohio farm produce on a weathered wooden table: sweet corn with husks, heirloom tomatoes, peaches, fresh herbs, burlap, bright natural daylight." |
| `images/terra-ceramics.jpg` | 4:3 | "A long table set with handmade clay plates and bowls, natural linen napkins, sprigs of rosemary and thyme, sand and terracotta tones, soft daylight." |

## C. Menu dish photos (used by the hover-image on every menu, all options) — 1:1
| File | Dish | Prompt (add the shared dish style) |
|---|---|---|
| `images/menu-hash.jpg` | Brisket Hash | "Smoked brisket hash with crispy golden potatoes, roasted peppers and two sunny-side-up farm eggs in a small cast-iron skillet." |
| `images/menu-goetta.jpg` | Goetta & Eggs | "Two crisp browned slices of Cincinnati goetta (pork and pinhead-oat sausage), two fried eggs and toasted sourdough." |
| `images/menu-oats.jpg` | Steel-Cut Oats | "Bowl of creamy steel-cut oats topped with caramelised roasted apple slices, toasted pecans and a spoon of brown sugar." |
| `images/menu-avotoast.jpg` | Tomato Toast | "Thick slice of seeded rye toast with whipped ricotta, sliced heirloom tomatoes, fresh basil and a drizzle of olive oil." |
| `images/menu-reuben.jpg` | Reuben | "Classic Reuben sandwich on grilled rye, stacked corned beef, sauerkraut and melted Swiss, cut in half showing layers, pickle spear." |
| `images/menu-grainbowl.jpg` | Farro Grain Bowl | "Farro grain bowl with roasted squash, kale, pickled red onion, tahini drizzle and pepitas." |
| `images/menu-soup.jpg` | Tomato Bisque & Grilled Cheese | "Bowl of creamy tomato bisque with basil oil beside a golden aged-cheddar grilled cheese cut diagonally." |
| `images/menu-porkchop.jpg` | Bone-In Pork Chop | "Seared bone-in pork chop with apple mostarda, braised greens and creamy cheddar grits." |
| `images/menu-steak.jpg` | Ohio Strip Steak | "Sliced medium-rare dry-aged strip steak with beef-fat roasted potatoes and a small jug of peppercorn sauce." |
| `images/menu-squash.jpg` | Roasted Delicata Squash | "Roasted delicata squash rings glazed with maple-miso over farro, sprinkled with hazelnut dukkah and fresh herbs." |
| `images/menu-pierogi.jpg` | Potato & Cheddar Pierogi | "Pan-fried potato and cheddar pierogi with brown-butter onions, a spoon of sour cream and chives." |
| `images/menu-spritz.jpg` | Rooftop Spritz | "Bright orange aperitivo spritz in a large wine glass with ice and a grapefruit slice, rooftop bar at golden hour, blurred skyline behind." |
| `images/menu-beer.jpg` | Columbus Draft | "Pint of amber craft beer with a foamy head on a wooden bar, tap handles blurred behind." |
| `images/menu-wine.jpg` | Ohio River Valley Red | "Glass of deep red wine on an oak table beside the bottle (no label text), candlelight." |
| `images/menu-zero.jpg` | Garden Tonic (0%) | "Tall highball of sparkling cucumber-basil tonic with lime, ice and a cucumber ribbon, fresh green, bright." |

Total: 2 videos + 2 posters + 23 photos (8 option photos + 15 dishes).

"""
seed_kb.py
==========
One-time script to seed the FAISS knowledge base used by idea_intake_agent.py's
check_rag_knowledge_base() function.

Run this from the project root:
    python seed_kb.py

Outputs (in the same directory):
    knowledge_base.faiss          -- FAISS IndexFlatIP (768-dim, L2-normalised)
    knowledge_base.faiss.meta.json -- companion metadata for each vector

Re-run any time you want to add/update entries in PRODUCTS below.
Do NOT modify idea_intake_agent.py to add entries -- edit this file instead.

Requires:
    GEMINI_API_KEY set in .env (auto-loaded from the same .env as the agent)
    pip install google-genai faiss-cpu numpy python-dotenv
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).parent.resolve()
sys.path.insert(0, str(HERE))

from idea_intake_agent import seed_faiss_knowledge_base

PRODUCTS = [
    {
        "name": "NirogStreet",
        "description": "NirogStreet is India's largest Ayurvedic doctor network and practice management platform, connecting over 60,000 AYUSH practitioners with patients for teleconsultations and clinical support. The platform offers Ayurvedic medicines, diagnostic tools, and a practitioner community. It operates a B2B SaaS model for clinic digitisation alongside its patient-facing marketplace.",
        "url": "https://www.nirogstreet.com",
    },
    {
        "name": "Jiva Ayurveda",
        "description": "Jiva Ayurveda provides personalised Ayurvedic consultations and treatment plans online and through a network of clinics across India. Patients complete a detailed Prakriti assessment and receive customised herbal formulations. The company has served millions of patients and operates a hybrid teleconsultation plus D2C herbal products model.",
        "url": "https://www.jiva.com",
    },
    {
        "name": "AyurUniverse",
        "description": "AyurUniverse is a curated marketplace and information platform for Ayurvedic wellness, connecting patients with certified Ayurvedic resorts, clinics, and practitioners across India. It enables online booking for Panchakarma and other Ayurvedic therapies. The platform targets wellness tourism and domestic patients seeking authentic Ayurvedic experiences.",
        "url": "https://www.ayuruniverse.com",
    },
    {
        "name": "Vedique Wellness",
        "description": "Vedique Wellness is the digital arm of Patanjali, offering Ayurvedic teleconsultations with Patanjali doctors and direct purchase of herbal medicines and nutraceuticals. It leverages Patanjali's established brand trust and massive offline distribution network. The platform targets price-sensitive consumers seeking accessible Ayurvedic guidance.",
        "url": "https://www.patanjaliayurved.net",
    },
    {
        "name": "The Ayurveda Experience",
        "description": "The Ayurveda Experience (iYURA) is a premium D2C brand offering Ayurvedic beauty, skincare, and wellness products with a strong global e-commerce presence in the US and UK. Products are formulated using classical Ayurvedic texts and modern safety testing. The brand has achieved significant revenue scale and built a large international subscriber base through content-led marketing.",
        "url": "https://www.theayurvedaexperience.com",
    },
    {
        "name": "Kama Ayurveda",
        "description": "Kama Ayurveda is a luxury Ayurvedic personal care brand offering skincare, haircare, and body care products formulated with authentic Ayurvedic ingredients. It has grown through premium retail channels, online sales, and international expansion. The brand was acquired by Nykaa, validating its strong brand equity in the premium wellness segment.",
        "url": "https://www.kamaayurveda.com",
    },
    {
        "name": "Forest Essentials",
        "description": "Forest Essentials is a luxury Ayurvedic beauty brand known for handcrafted products using traditional Indian recipes and high-quality natural ingredients. It operates premium retail stores and a strong e-commerce channel. Estee Lauder Companies holds a significant stake, and the brand competes with international luxury skincare labels.",
        "url": "https://www.forestessentialsindia.com",
    },
    {
        "name": "SkinKraft",
        "description": "SkinKraft is an AI-powered personalised skincare platform that creates custom skincare regimens based on a detailed user skin profile assessment. It competes directly with Ayurvedic personalised skincare brands and has raised venture capital. The platform has served hundreds of thousands of customers in India.",
        "url": "https://www.skinkraft.com",
    },
    {
        "name": "Kapiva",
        "description": "Kapiva is a modern Ayurvedic nutrition brand offering herbal juices, supplements, and functional foods blending classical Ayurvedic formulas with contemporary wellness science. The company has raised Series A funding and distributes via D2C e-commerce, quick commerce, and offline retail. It positions itself as a science-backed Ayurvedic alternative to conventional nutraceuticals.",
        "url": "https://www.kapiva.in",
    },
    {
        "name": "Oziva",
        "description": "Oziva is a plant-based nutrition and wellness brand offering protein powders, vitamins, and herbal supplements with a focus on clean ingredients and clinical efficacy. The company raised significant venture capital and was acquired by Hindustan Unilever. It bridges the gap between traditional herbal wellness and modern sports nutrition.",
        "url": "https://www.oziva.in",
    },
    {
        "name": "Himalaya Drug Company",
        "description": "Himalaya Drug Company is one of India's largest herbal healthcare companies, with a wide portfolio spanning pharmaceuticals, personal care, and animal health products based on Ayurvedic formulations. Operating for nearly a century, it sells in over 100 countries. It is a key benchmark competitor for any AYUSH nutraceutical or herbal supplement startup.",
        "url": "https://www.himalayawellness.com",
    },
    {
        "name": "Vedix",
        "description": "Vedix is an AI-powered personalised Ayurvedic haircare brand that uses a dosha assessment quiz to create custom herbal haircare kits for individual customers. The company has scaled rapidly through D2C e-commerce and raised venture funding. It directly targets the overlap between personalisation tech and Ayurvedic product formulation.",
        "url": "https://www.vedix.com",
    },
    {
        "name": "HealthifyMe",
        "description": "HealthifyMe is India's leading AI-powered health and fitness app offering personalised diet plans, calorie tracking, and fitness coaching. The platform has over 30 million users and raised over $100M in funding. While not Ayurveda-specific, it competes adjacent to AYUSH wellness apps through its AI nutrition guidance and wellness coaching features.",
        "url": "https://www.healthifyme.com",
    },
    {
        "name": "Wellcure",
        "description": "Wellcure is a natural health platform offering personalised wellness plans, expert consultations with naturopathy and Ayurveda practitioners, and a community for natural living. The platform provides digital access to AYUSH practitioners for online consultations and customised lifestyle recommendations based on natural healing principles.",
        "url": "https://www.wellcure.com",
    },
    {
        "name": "Cult.fit",
        "description": "Cult.fit is a comprehensive fitness and wellness platform offering gym services, online fitness classes, mental wellness, and nutrition coaching. It has raised over $400M in funding. Though not AYUSH-specific, it competes in the integrated wellness space where AYUSH startups targeting urban wellness consumers will frequently encounter it.",
        "url": "https://www.cult.fit",
    },
    {
        "name": "Sattva App",
        "description": "Sattva is a guided meditation and Vedic wisdom app offering pranayama, mantra meditation, and Ayurvedic lifestyle guidance rooted in Vedic tradition. The app serves a global audience and integrates ancient Indian wellness practices with a modern app experience. It competes in the digital mindfulness space with a distinctly AYUSH-adjacent philosophical base.",
        "url": "https://www.sattva.life",
    },
    {
        "name": "eVaidya",
        "description": "eVaidya is a telemedicine platform specifically designed for Ayurvedic and AYUSH practitioners, enabling online consultations, digital prescriptions, and patient record management. It is purpose-built for the AYUSH sector and competes directly with startups building clinic SaaS or teleconsultation tools for Ayurvedic doctors.",
        "url": "https://www.evaidya.com",
    },
    {
        "name": "Practo",
        "description": "Practo is India's largest healthcare platform offering clinic management software, online appointment booking, teleconsultation, and electronic health records. It increasingly serves AYUSH practitioners alongside allopathic doctors. With tens of millions of patients and significant VC backing, it is a dominant competitor for any clinic SaaS built for AYUSH practitioners.",
        "url": "https://www.practo.com",
    },
    {
        "name": "Lybrate",
        "description": "Lybrate is an online healthcare platform connecting patients with doctors including AYUSH practitioners for teleconsultations and Q&A. It offers clinic software and patient management tools. The platform competes directly with AYUSH-specific clinic management SaaS products and practitioner-patient matching platforms.",
        "url": "https://www.lybrate.com",
    },
    {
        "name": "mfine",
        "description": "mfine is an AI-powered online doctor consultation platform offering instant access to doctors across specialities through partnered hospitals. It uses AI for symptom checking and matching patients to specialists. Though allopathy-focused, it competes in the urban telemedicine market where AYUSH teleconsultation startups also operate.",
        "url": "https://www.mfine.co",
    },
    {
        "name": "1mg (Tata 1mg)",
        "description": "Tata 1mg is India's largest digital pharmacy and health platform, offering medicine delivery including Ayurvedic and herbal products, online doctor consultations, lab tests, and health records. Acquired by Tata Digital, it is a dominant competitor for any AYUSH product marketplace or teleconsultation platform targeting Indian consumers.",
        "url": "https://www.1mg.com",
    },
    {
        "name": "PharmEasy",
        "description": "PharmEasy is one of India's leading online pharmacy and healthcare services platforms, offering medicine delivery, diagnostics, and teleconsultations. Its catalogue includes Ayurvedic and herbal products. With substantial funding and a large user base, it competes as a distribution channel against D2C Ayurvedic brands and as a platform against AYUSH teleconsultation products.",
        "url": "https://www.pharmeasy.in",
    },
    {
        "name": "Pristyn Care",
        "description": "Pristyn Care is a tech-enabled healthcare company partnering with hospitals for elective surgeries and specialised treatments, with a digital-first patient acquisition model. It has raised substantial venture capital. While not AYUSH-specific, it demonstrates the practitioner-verified, tech-enabled care model that AYUSH platforms often try to replicate.",
        "url": "https://www.pristyncare.com",
    },
    {
        "name": "Nykaa Naturals",
        "description": "Nykaa Naturals is Nykaa's private-label range of natural and Ayurveda-inspired beauty and personal care products available on the Nykaa platform. It leverages Nykaa's massive beauty e-commerce distribution and customer base. The range competes with D2C Ayurvedic brands on price and convenience.",
        "url": "https://www.nykaa.com",
    },
    {
        "name": "Netmeds",
        "description": "Netmeds is a major Indian online pharmacy acquired by Reliance Retail that sells prescription medicines, OTC drugs, and a significant range of Ayurvedic, herbal, and homeopathic products. It competes in the e-pharmacy and health product marketplace segment, particularly relevant for AYUSH product brands seeking distribution.",
        "url": "https://www.netmeds.com",
    },
    {
        "name": "Nourish Organics",
        "description": "Nourish Organics is a D2C healthy snacking and functional food brand using natural and organic ingredients with Ayurvedic superfoods like turmeric and ashwagandha. The brand targets urban health-conscious consumers and sells through its own website and major e-commerce platforms. It represents the functional food overlap with Ayurvedic nutraceuticals.",
        "url": "https://www.nourishyou.in",
    },
    {
        "name": "Wellnessforever",
        "description": "Wellnessforever is a pharmacy and wellness retail chain with an omnichannel model covering online ordering and physical stores, carrying a wide range of wellness, nutraceutical, Ayurvedic, and personal care products. It competes in the offline-to-online wellness retail segment and is relevant as an adjacent competitor for AYUSH product marketplaces and D2C brands.",
        "url": "https://www.wellnessforever.com",
    },
    {
        "name": "AarogyaPath",
        "description": "AarogyaPath is a digital AYUSH health platform offering personalised Ayurvedic lifestyle recommendations, Prakriti-based wellness plans, and online access to certified Ayurvedic doctors. The platform integrates AI-driven constitution assessment with verified practitioner oversight, targeting urban Indians seeking holistic healthcare alternatives within the government-recognised AYUSH framework.",
        "url": "",
    },
]

if __name__ == "__main__":
    OUTPUT_PATH = str(HERE / "knowledge_base.faiss")

    print("=" * 60)
    print(f"  Seeding FAISS knowledge base with {len(PRODUCTS)} entries")
    print(f"  Output : {OUTPUT_PATH}")
    print(f"  Meta   : {OUTPUT_PATH}.meta.json")
    print("=" * 60)

    seed_faiss_knowledge_base(products=PRODUCTS, output_path=OUTPUT_PATH)

    print()
    print("=" * 60)
    print("  Done! knowledge_base.faiss and .meta.json are ready.")
    print("  Run idea_intake_agent.py to test the knowledge base.")
    print("=" * 60)

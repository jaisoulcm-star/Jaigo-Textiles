import KANCHIPURAM_IMAGE from "./assets/images/regenerated_image_1777941209294.png";
import CHETTINAD_IMAGE from "./assets/images/regenerated_image_1778004429912.png";
import MADURAI_IMAGE from "./assets/images/regenerated_image_1778007742069.png";
import STORY_IMAGE from "./assets/images/story.png";
import STORY_HERO_IMAGE from "./assets/images/story_heritage_watercolor_1779737444513.png";

export const HERITAGE_IMAGES = {
  HERO: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=2600",
  STORY: STORY_IMAGE,
  STORY_HERO: STORY_HERO_IMAGE,
  KANCHIPURAM_SILK: KANCHIPURAM_IMAGE,
  CHETTINAD_COTTON: CHETTINAD_IMAGE,
  MADURAI_SUNGUDI: MADURAI_IMAGE,
  KERALA_KASAVU:
    "https://images.unsplash.com/photo-1609102029285-055376045610?auto=format&fit=crop&q=80&w=1000",
  COIMBATORE_SILK:
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1000",
  LOOM_ACTION:
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=1000",
  TEXTURE_GOLD:
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000",
  TEXTURE_SILK:
    "https://images.unsplash.com/photo-1580917228991-032014f3b06c?auto=format&fit=crop&q=80&w=1000",
};

export const MOCK_SAREE_IMAGES = [
  KANCHIPURAM_IMAGE,
  CHETTINAD_IMAGE,
  MADURAI_IMAGE,
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800",
  CHETTINAD_IMAGE,
  "https://images.unsplash.com/photo-1583391733975-acdef992163b?auto=format&fit=crop&q=80&w=800",
];

export const MOCK_COSMETIC_IMAGES = [
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1596755094514-f87034a764c6?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1591871937573-74dbba515c4c?auto=format&fit=crop&q=80&w=800",
];

export const MOCK_ACCESSORY_IMAGES = [
  "https://images.unsplash.com/photo-1614179662397-885f9ad66ca7?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800",
  MADURAI_IMAGE,
  "https://images.unsplash.com/photo-1590156221122-c748e7892b07?auto=format&fit=crop&q=80&w=800",
];

export const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Royal Heritage Kanchipuram Silk",
    subtitle: "A Masterpiece from the Temple Town of Kanchipuram",
    description: "Breathtaking maroon silk with authentic gold zari weave.",
    price: 18500,
    category: "Silk",
    imageUrls: [MOCK_SAREE_IMAGES[0]],
    isFeatured: true,
    isBestSeller: true,
    stock: 5,
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Chettinad Aiyiram Butta Cotton",
    subtitle: "Hand-loomed by Heritage Weavers of Karaikudi",
    description: "Heritage handloom cotton with traditional temple borders.",
    price: 4200,
    category: "Cotton",
    imageUrls: [MOCK_SAREE_IMAGES[1]],
    isNew: true,
    stock: 12,
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Madurai Sungudi Tie-Dye Silk",
    subtitle: "Authentic Vaigai Artistry from Madurai",
    description: "Extravagant red silk saree for the most special occasions.",
    price: 45000,
    category: "Madurai",
    imageUrls: [MOCK_SAREE_IMAGES[2]],
    isFeatured: true,
    stock: 2,
    createdAt: new Date(),
  },
  {
    id: "k2",
    name: "Kerala Kasavu Golden Tissue",
    subtitle: "Traditional God's Own Country Handloom",
    description:
      "Elegant golden tissue saree with traditional Kerala handloom motifs, perfect for festivities.",
    price: 5500,
    category: "Kerala",
    imageUrls: [
      "https://images.unsplash.com/photo-1610030482782-b312150f839c?auto=format&fit=crop&q=80&w=800",
    ],
    isNew: true,
    stock: 15,
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Temple Motif Daily Wear",
    description: "Simple yet elegant cotton saree for daily grace.",
    price: 2800,
    category: "Traditional",
    imageUrls: [MOCK_SAREE_IMAGES[3]],
    isBestSeller: true,
    stock: 20,
    createdAt: new Date(),
  },
  {
    id: "9",
    name: "Pure Silk Jewelry Box",
    description: "Compact travel jewelry box covered in authentic Kanchipuram silk with multiple compartments.",
    price: 2400,
    category: "Accessories",
    imageUrls: [MOCK_ACCESSORY_IMAGES[1]],
    isNew: true,
    stock: 15,
    createdAt: new Date(),
  },
  {
    id: "8",
    name: "Handwoven Zari Potli Bag",
    description:
      "Exquisite silk potli bag with intricate gold thread work and tassel drawstrings.",
    price: 1800,
    category: "Accessories",
    imageUrls: [MOCK_ACCESSORY_IMAGES[0]],
    isBestSeller: true,
    stock: 25,
    createdAt: new Date(),
  },
];

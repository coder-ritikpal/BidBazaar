
export const buildProductPayload = (sellerId, overrides = {}) => ({
  title: "Vintage Camera",
  description: "Fully functional film camera",
  price: 4500,

  category: "Electronics",

  size: "10*20",
  sizeUnit: "cm",

  weight: 2,
  weightUnit: "kg",

  color: "Black",
  material: "Metal",
  brand: "Canon",

  condition: "Good",

  reviewStatus: "under_review",

  reviewEndsAt: new Date(Date.now() + 60 * 60 * 1000),
  startAuctionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),

  auctionDuration: 7,
  auctionDurationUnit: "days",

  sellerId,

  images: [
    {
      url: "https://example.com/image.jpg",
      thumbnailUrl: "https://example.com/thumb.jpg",
      id: "image_1",
    },
  ],

  ...overrides,
});
export const BNM_REWARDS = [
  {
    id: "hoodie",
    name: "Be Near Me Hoodie",
    description: "Wear the movement.",
    points: 2000,
    category: "Apparel",
    internal: true,
    visual: "hoodie",
  },
  {
    id: "bottle",
    name: "Be Near Me Eco Bottle",
    description: "Stay hydrated. Do more good.",
    points: 800,
    category: "Apparel",
    internal: true,
    visual: "bottle",
  },
  {
    id: "tote",
    name: "Be Near Me Tote Bag",
    description: "Carry a cleaner, brighter tomorrow.",
    points: 700,
    category: "Apparel",
    internal: true,
    visual: "tote",
  },
  {
    id: "plant-tree",
    name: "Plant a Tree",
    description: "Impact reward activated only through a verified nonprofit partner.",
    points: 400,
    category: "Impact",
    internal: false,
    requires_verified_partner: true,
    visual: "leaf",
  },
];

export function getReward(id) {
  return BNM_REWARDS.find((reward) => reward.id === id) || BNM_REWARDS[0];
}

export const REWARD_POLICY = {
  currency: "kindness_points",
  cash_value: false,
  unverified_partner_redemption_allowed: false,
  note: "Kindness points are an in-app reward ledger and are separate from platform cash payments.",
};

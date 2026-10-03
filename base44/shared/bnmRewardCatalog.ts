export const SERVER_REWARD_CATALOG = {
  hoodie: { name: "Be Near Me Hoodie", points: 2000, requiresVerifiedPartner: false },
  bottle: { name: "Be Near Me Eco Bottle", points: 800, requiresVerifiedPartner: false },
  tote: { name: "Be Near Me Tote Bag", points: 700, requiresVerifiedPartner: false },
  "plant-tree": { name: "Plant a Tree", points: 400, requiresVerifiedPartner: true },
} as const;

export function getServerReward(id: string) {
  return SERVER_REWARD_CATALOG[id as keyof typeof SERVER_REWARD_CATALOG] || null;
}

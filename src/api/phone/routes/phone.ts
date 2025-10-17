import phoneController from "../controllers/phone";

export default [
  {
    method: "GET",
    path: "/phones/next",
    handler: async (ctx) => {
      const controller = phoneController({ strapi }); // Instancia
      return controller.getNext(ctx);
    },
    config: { auth: false },
  },
];

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::phone.phone", ({ strapi }) => ({
  async getNext(ctx) {
    try {
      //  Traer todos los phones
      const phones = await strapi.db.query("api::phone.phone").findMany({
        orderBy: { id: "asc" },
      });

      if (!phones || phones.length === 0) {
        return ctx.send({ error: "No hay números registrados" }, 400);
      }

      //  Buscar el primero que no esté usado
      let nextPhone = phones.find(p => !p.used);

      //  Si todos están usados, resetear todos a false y tomar el primero
      if (!nextPhone) {
        await strapi.db.query("api::phone.phone").updateMany({
          where: {},
          data: { used: false },
        });
        nextPhone = phones[0];
      }

      //  Marcar el número elegido como usado
      await strapi.db.query("api::phone.phone").update({
        where: { id: nextPhone.id },
        data: { used: true },
      });

      // 5️⃣ Devolverlo
      return ctx.send({ number: nextPhone.number });
    } catch (err) {
      console.error("Error en getNext:", err);
      return ctx.send({ error: "Error interno del servidor" }, 500);
    }
  },
}));

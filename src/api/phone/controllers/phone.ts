import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::phone.phone", ({ strapi }) => ({
  async getNext(ctx) {
    try {
      const knex = strapi.db.connection; // Obtenemos conexión directa

      // Ejecutamos en transacción
      const result = await knex.transaction(async (trx) => {
        // 1️⃣ Buscar el primer número libre y bloquearlo para esta transacción
        const [nextPhone] = await trx("phones")
          .where({ used: false })
          .orderBy("id", "asc")
          .forUpdate() // Bloquea la fila durante la transacción
          .limit(1);

        if (!nextPhone) {
          // 2️⃣ Si no hay libres, resetear todos
          await trx("phones").update({ used: false });
          const [first] = await trx("phones").orderBy("id", "asc").limit(1);
          await trx("phones").where({ id: first.id }).update({ used: true });
          return first;
        }

        // 3️⃣ Marcar el número encontrado como usado
        await trx("phones").where({ id: nextPhone.id }).update({ used: true });
        return nextPhone;
      });

      return ctx.send({ number: result.number });
    } catch (err) {
      console.error("Error en getNext:", err);
      return ctx.send({ error: "Error interno del servidor" }, 500);
    }
  },
}));

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::phone.phone", ({ strapi }) => ({
  async getNext(ctx) {
    try {
      const knex = strapi.db.connection; 

      // Ejecutamos en transacción
      const result = await knex.transaction(async (trx) => {
        // 1️⃣ Buscar el primer número libre y bloquearlo para esta transacción
        const [nextPhone] = await trx("phones")
          .where({ used: false })
          .orderBy("id", "asc")
          .forUpdate() // Bloquea la fila libre durante la transacción
          .limit(1);

        if (nextPhone) {
          // 3️⃣ Marcar el número encontrado como usado
          await trx("phones").where({ id: nextPhone.id }).update({ used: true });
          return nextPhone;

        } else {
          // 2️⃣ Si no hay libres, forzamos un bloqueo en la primera fila
          // para que solo una transacción intente el reseteo global.
          // *Importante:* Esto asume que tenes al menos 1 número en la tabla.
          const [firstToLock] = await trx("phones")
            .orderBy("id", "asc")
            .forUpdate() // Bloquea la primera fila
            .limit(1);
            
          // Si por alguna razón la tabla está vacía, evitamos errores.
          if (!firstToLock) {
              console.error("La tabla de teléfonos está vacía.");
              return null; // O el manejo de error que prefieras
          }

          // Realizamos el reseteo una vez que tenemos un bloqueo (en firstToLock)
          await trx("phones").update({ used: false });
          
          // Re-buscamos el primer elemento (ahora ya sabemos que existe y está libre)
          await trx("phones").where({ id: firstToLock.id }).update({ used: true });
          
          return firstToLock;
        }
      });
      
      // Si result es null (por ejemplo, tabla vacía), manejamos.
      if (!result || !result.number) {
          return ctx.send({ number: null, error: "No hay números disponibles" });
      }

      return ctx.send({ number: result.number });
      
    } catch (err) {
      console.error("Error en getNext:", err);
      return ctx.send({ error: "Error interno del servidor" }, 500);
    }
  },
}));
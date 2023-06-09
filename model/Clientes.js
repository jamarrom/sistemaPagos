
async function listClientesSelect() {
  const listClientes = await prisma.clientes.findMany({
    select: {
      cliente_id: true,
      nombre: true,
      apellidos: true
    },
  });

  return listClientes;
}
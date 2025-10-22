export const getSocios = (req, res) => {
  res.json({ message: "Devolviendo listado de socios", socios: [
    { id: 1, nombre: "Socio 1", apellidos: "Apellidos 1", statusMembership: "activo"},
    { id: 2, nombre: "Socio 2", apellidos: "Apellidos 2", statusMembership: "inactivo"},
    { id: 3, nombre: "Socio 3", apellidos: "Apellidos 3", statusMembership: "activo"}
  ]});
};
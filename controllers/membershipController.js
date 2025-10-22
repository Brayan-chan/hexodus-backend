export const getMemberships = (req, res) => {
  res.json({ message: "Devolviendo listado de membresías", memberships: [
    { id: 1, nombre: "Membresía 1", tipo: "Premium", precio: 100 },
    { id: 2, nombre: "Membresía 2", tipo: "Básica", precio: 50 },
    { id: 3, nombre: "Membresía 3", tipo: "VIP", precio: 150 }
  ]});
};
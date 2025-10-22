export const getVentas = (req, res) => {
  res.json({ message: "Devolviendo listado de ventas", ventas: [
    { id: 1, producto: "Producto 1", cantidad: 10, precio: 100 },
    { id: 2, producto: "Producto 2", cantidad: 5, precio: 200 },
    { id: 3, producto: "Producto 3", cantidad: 8, precio: 150 }
  ]});
};
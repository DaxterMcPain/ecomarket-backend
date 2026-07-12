import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());


let products = [];
let cart = [];
let purchases = [];
let users = [
    {
        id: 1,
        name: "Administrador",
        email: "admin@gmail.com",
        password: "admin123",
        role: "admin"
    },
    {
        id: 2,
        name: "Cliente",
        email: "cliente@gmail.com",
        password: "123456",
        role: "user"
    }
];
let currentUser = null;


app.get("/products", (req, res) => {

    res.json(products);

});

app.get("/cart", (req, res) => {
    res.json(cart);
});

app.get("/purchase", (req, res) => {

    res.json(purchases);

});

app.get("/profile", (req, res) => {

    if (!currentUser) {

        return res.status(401).json({
            message: "No hay una sesión iniciada"
        });

    }

    res.json(currentUser);

});

app.post("/products", (req, res) => {

    const newProduct = {

        id: Date.now(),

        name: req.body.name,

        category: req.body.category,

        price: req.body.price

    };


    products.push(newProduct);


    res.json({
        message: "Producto creado",
        product: newProduct
    });

});

app.post("/cart", (req, res) => {

    const product = req.body;

    cart.push(product);

    res.json({
        message: "Producto agregado al carrito",
        cart
    });

});

app.post("/purchase", (req, res) => {

    const purchase = {
        id: Date.now(),
        products: cart,
        total: req.body.total,
        date: new Date().toLocaleDateString()
    };

    purchases.push(purchase);

    cart = [];

    res.json({
        message: "Compra realizada correctamente",
        purchase
    });

});

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const user = users.find(
        user =>
            user.email === email &&
            user.password === password
    );

    if (!user) {

        return res.status(401).json({
            message: "Correo o contraseña incorrectos"
        });

    }

    currentUser = user;

    res.json({
        message: "Inicio de sesión correcto",
        user
    });

});

app.post("/logout", (req, res) => {

    currentUser = null;

    res.json({
        message: "Sesión cerrada"
    });

});

app.delete("/products/:id", (req, res) => {

    products = products.filter(
        product => product.id != req.params.id
    );


    res.json({
        message: "Producto eliminado"
    });

});

app.delete("/cart/:id", (req, res) => {

    cart = cart.filter(
        product => product.id != req.params.id
    );

    res.json({
        message: "Producto eliminado"
    });

});


app.listen(3000, () => {

    console.log(
        "Servidor funcionando en puerto 3000"
    );

});
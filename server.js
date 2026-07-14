import "dotenv/config";
import db from "./db.js";
import express from "express";
import cors from "cors";

const app = express();

app.use((req, res, next) => {

    next();

});

app.use(cors());
app.use(express.json());
try {

    const connection = await db.getConnection();

    console.log("✅ Conectado a MySQL");

    connection.release();

} catch (error) {

    console.error(error);

}

let currentUser = null;


app.get("/products", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM products"
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener los productos"
        });

    }

});

app.get("/cart", async (req, res) => {

    if (!currentUser) {

        return res.status(401).json({
            message: "Debe iniciar sesión"
        });

    }

    try {

        const [rows] = await db.query(

            `SELECT
                cart.id,
                products.name,
                products.category,
                products.price,
                cart.quantity
             FROM cart
             INNER JOIN products
             ON cart.product_id = products.id
             WHERE cart.user_id = ?`,

            [currentUser.id]

        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener el carrito"
        });

    }

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

app.get("/users", async (req, res) => {

    try {

        const [rows] = await db.query(

            `SELECT
                id,
                name,
                email,
                role
             FROM users`

        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener usuarios"
        });

    }

});

app.get("/reports", async (req, res) => {

    try {

        const [rows] = await db.query(

            `SELECT
                purchases.id,
                users.name,
                users.email,
                purchases.total,
                purchases.purchase_date
             FROM purchases
             INNER JOIN users
             ON purchases.user_id = users.id
             ORDER BY purchases.purchase_date DESC`

        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener los reportes"
        });

    }

});

app.post("/products", async (req, res) => {

    const { name, category, price } = req.body;

    try {

        await db.query(

            `INSERT INTO products
            (name, category, price)
            VALUES (?, ?, ?)`,

            [name, category, price]

        );

        res.json({
            message: "Producto agregado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al agregar el producto"
        });

    }

});

app.post("/guest", async (req, res) => {

    try {

        const guestEmail = `invitado_${Date.now()}@guest.ecomarket.local`;
        const guestPassword = Math.random().toString(36).slice(2);

        const [result] = await db.query(

            `INSERT INTO users
            (name, email, password, role)
            VALUES (?, ?, ?, 'guest')`,

            ["Invitado", guestEmail, guestPassword]

        );

        currentUser = {
            id: result.insertId,
            name: "Invitado",
            email: guestEmail,
            role: "guest"
        };

        res.json({
            message: "Ingresaste como invitado",
            user: currentUser
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al ingresar como invitado"
        });

    }

});

app.post("/cart", async (req, res) => {

    const { id } = req.body;

    if (!currentUser) {

        return res.status(401).json({
            message: "Debe iniciar sesión"
        });

    }

    try {

        await db.query(

            `INSERT INTO cart
            (user_id, product_id, quantity)
            VALUES (?, ?, 1)`,

            [currentUser.id, id]

        );

        res.json({
            message: "Producto agregado al carrito"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al agregar al carrito"
        });

    }

});

app.post("/purchase", async (req, res) => {

    if (!currentUser) {

        return res.status(401).json({
            message: "Debe iniciar sesión"
        });

    }

    try {

        const [cartItems] = await db.query(

            `SELECT
                cart.product_id,
                cart.quantity,
                products.price
             FROM cart
             INNER JOIN products
             ON cart.product_id = products.id
             WHERE cart.user_id = ?`,

            [currentUser.id]

        );

        if (cartItems.length === 0) {

            return res.status(400).json({
                message: "El carrito está vacío"
            });

        }

        const total = cartItems.reduce(

            (sum, item) =>

                sum + (item.price * item.quantity),

            0

        );

        const [purchase] = await db.query(

            `INSERT INTO purchases
            (user_id, total)
            VALUES (?, ?)`,

            [currentUser.id, total]

        );

        await db.query(

            "DELETE FROM cart WHERE user_id = ?",

            [currentUser.id]

        );

        res.json({
            message: "Compra realizada correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al realizar la compra"
        });

    }

});

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    try {

        const [rows] = await db.query(

            "SELECT id FROM users WHERE email = ?",

            [email]

        );

        if (rows.length > 0) {

            return res.status(400).json({
                message: "El correo ya está registrado"
            });

        }

        await db.query(

            `INSERT INTO users
            (name, email, password, role)
            VALUES (?, ?, ?, 'user')`,

            [name, email, password]

        );

        res.json({
            message: "Usuario registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al registrar el usuario"
        });

    }

});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const [rows] = await db.query(

            "SELECT * FROM users WHERE email = ? AND password = ?",

            [email, password]

        );

        if (rows.length === 0) {

            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });

        }

        currentUser = rows[0];

        res.json({
            message: "Inicio de sesión correcto",
            user: currentUser
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error en el servidor"
        });

    }

});

app.post("/logout", (req, res) => {

    currentUser = null;

    res.json({
        message: "Sesión cerrada"
    });

});

app.delete("/products/:id", async (req, res) => {

    try {

        await db.query(
            "DELETE FROM cart WHERE product_id = ?",
            [req.params.id]
        );

        await db.query(
            "DELETE FROM products WHERE id = ?",
            [req.params.id]
        );

        res.json({
            message: "Producto eliminado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al eliminar el producto"
        });

    }

});

app.delete("/cart/:id", async (req, res) => {

    try {

        await db.query(

            "DELETE FROM cart WHERE id = ?",

            [req.params.id]

        );

        res.json({
            message: "Producto eliminado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al eliminar"
        });

    }

});

app.delete("/users/:id", async (req, res) => {

    try {

        await db.query(
            "DELETE FROM cart WHERE user_id = ?",
            [req.params.id]
        );

        await db.query(
            "DELETE FROM purchases WHERE user_id = ?",
            [req.params.id]
        );

        await db.query(

            "DELETE FROM users WHERE id = ?",

            [req.params.id]

        );

        res.json({
            message: "Usuario eliminado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al eliminar usuario"
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor funcionando en puerto ${PORT}`
    );

});
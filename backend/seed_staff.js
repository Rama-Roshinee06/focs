const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

mongoose
    .connect("mongodb://127.0.0.1:27017/orphanage_db")
    .then(async () => {
        console.log("MongoDB connected");

        const email = "staff@hopehaven.com";
        const password = "staffPassword123";
        const role = "staff";

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log("Staff user already exists.");
            // Optional: Update password
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({ email, password: hashedPassword, role });
            console.log(`Staff user created: ${email} / ${password}`);
        }

        mongoose.connection.close();
    })
    .catch((err) => console.log(err));

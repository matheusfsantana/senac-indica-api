const { User } = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt')

const userController = {

    createUser: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const { name, email, password } = req.body;

            const erros = []

            let trimmedName = name.trim();
            let trimmedEmail = email.trim();
            let trimmedPassword = password.trim();

            trimmedName = trimmedName.replace(/[^A-zÀ-ú\s]/gi, '');
            trimmedName = trimmedName.trim();

            if (trimmedName == '' || typeof trimmedName == undefined || trimmedName == null) {
                erros.push({ mensagem: "Campo nome não pode ser vazio!" });
            }

            if (!/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ\s]+$/.test(trimmedName)) {
                erros.push({ mensagem: "Nome Inválido!" });
            }

            if (email == '' || typeof email == undefined || email == null) {
                erros.push({ mensagem: "Campo email não pode ser vazio!" });
            }

            if (trimmedPassword == '' || typeof trimmedPassword == undefined || trimmedPassword == null) {
                erros.push({ mensagem: "Campo senha não pode ser vazio!" });
            }

            if (/^[a-z0-9.]+@[a-z0-9]+\.[a-z]+\.([a-z]+)?$/i.test(email)) {
                erros.push({ mensagem: "Campo email Inválido!" });
            }


            const user = await User.findOne({ email: trimmedEmail });
            const userExists = user instanceof User;

            if (userExists) {
                erros.push({ mensagem: "Email já cadastrado." });
            }

            if (erros.length > 0) {
                await session.abortTransaction();
                session.endSession();
                res.status(409).json({ erros: erros })
            }
            else {
                const salt = await bcrypt.genSalt(12)
                const passwordHash = await bcrypt.hash(trimmedPassword, salt)

                const newUser = {
                    name: name,
                    email: email.toLowerCase(),
                    password: passwordHash
                }
                const response = await User.create([newUser], { session })

                await session.commitTransaction();
                session.endSession();

                res.status(201).json({ response, msg: "Usuário criado com sucesso" });
            }

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.log(error);
            res.status(500).json({ msg: "Não foi possivel criar a o usuário" })
        }

    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body

            let erros = []

            if (email == '' || typeof email == undefined || email == null) {
                erros.push({ mensagem: "Campo email não pode ser vazio!" })
            }

            if (password == '' || typeof password == undefined || password == null) {
                erros.push({ mensagem: "Campo senha não pode ser vazio!" })
            }

            const user = await User.findOne({ email: email });
            const userExists = user instanceof User;

            if (!userExists) {
                erros.push({ mensagem: "Email Inválido." })
            } else {
                const userData = user.toJSON()
                const checkPassword = await bcrypt.compare(password, userData.password)

                if (!checkPassword) {
                    erros.push({ mensagem: "Senha Inválida." })
                }
            }

            if (erros.length > 0) {
                res.status(409).json({ erros: erros });
            } else {
                const userData = user.toJSON()
                res.status(200).json(userData);
            }
        } catch (error) {
            res.status(500).json("Não foi possivel completar o login");
        }
    },

    editUser: async(req,res) =>{
        try {

            const { _id, email,name, password} = req.body;

            let data = []; //dados que forem atualizados

            const user = await User.findById(_id);

            if (!user) {
                return res.status(404).json({ mensagem: "Usuário não encontrado" });
            }

            if(name)
            {
                user.name = name.trim();
                data.push({"name": user.name});
            }
            if(email)
            {
                user.email = email.trim();
                data.push({"email": user.email});
            }
            if(password)
            {
                const salt = await bcrypt.genSalt(12);
                const passwordHash = await bcrypt.hash(password, salt);
                user.password = passwordHash;
                data.push({"password": password});
            }
    
            
    
            await user.save();
    
            res.status(200).json({ mensagem: "Usuário atualizado com sucesso", data});
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensagem: "Não foi possível atualizar o usuário" });
        }
           
    },
    
    deleteUser: async(req,res) =>{
        try {
            const _id  = req.body;

            const user = await User.findById(_id);

            if(!user){
                return res.status(404).json({ mensagem: "Usuário não encontrado" });
            }

            await User.deleteOne(user);
            return res.status(200).json({ mensagem: "Usuário deletado" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensagem: "Não foi possível deletar o usuário", erro: {error}});
        }
    },

    getUserBydId: async(req,res) =>{
        try{
            const userId  = req.params.id;

            const user = await User.findById(userId);

            if(!user){
                return res.status(404).json({ mensagem: "Usuário não encontrado" });
            }

            const userData = user.toJSON()
            return res.status(200).json(userData);
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensagem: "Não foi possível buscar o usuário", erro: {error}});
        }
    }
}

module.exports = userController;
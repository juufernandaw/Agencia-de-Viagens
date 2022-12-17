require('dotenv').config()
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
require(path.join(__dirname+'/frontend/model/usuario.js'))
const Usuario = mongoose.model("users")
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
require("./config/auth")(passport)

app.set("view engine", "ejs");

function ehAutenticado(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    //req.flash("error_msg", "Você deve estar logado para entrar aqui") //exibir a mensagem
    //print("Você deve estar logado para entrar aqui")
    res.redirect("/")
}
    //Sessão
        app.use(session({
            secret: "SDHSJDAKSDHJD",
            resave: true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        //app.use(flash())

        app.use((req,res,next) => {
            //res.locals.success_msg = req.flash("sucess_msg")
            //res.locals.error_msg = req.flash("error_msg")
            //res.locals.error = req.flash("error") //essa msg não tá sendo exibida ainda 
            res.locals.user = req.user || null //armazena os dados do usuário logado em uma varíavel global
            
            next()
        })

        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
        app.use(express.static(path.join(__dirname + '/public')))

//Rotas
    app.get('/', (req,res) => {
        res.sendFile(path.join(__dirname+'/frontend/view/index.html'))
    })

    app.get('/inicio', ehAutenticado, function(req, res){
        const User1 = {
            id: req.user._id,
            nome: req.user.nome,
            email: req.user.email,
            viagens: req.user.viagens
        } 
        console.log(req.user)
        res.render("inicio", {usuarioLogado: User1})
    })
    
    app.get('/login', function(req, res){
        res.sendFile(path.join(__dirname+'/frontend/view/login.html'))
    })

    app.get('/register', function(req, res){
        res.sendFile(path.join(__dirname+'/frontend/view/register.html'))
    })

    app.post('/usuarios/cadastrar', function(req, res){
        var erros = []

        if(!req.body.user || typeof req.body.user == undefined || req.body.user == null){
            erros.push({texto: "Nome inválido"})
        }

        if(!req.body.mail || typeof req.body.mail == undefined || req.body.mail == null){
            erros.push({texto: "Email inválido"})
        }

        if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
            erros.push({texto: "Senha inválida"})
        }

        if(req.body.senha != req.body.confirmsenha){
            erros.push({texto: "As senhas não"})
        }

        if(req.body.senha.length < 4){
            //req.flash("error_msg", "SENHA CURTA")
            erros.push({texto: "Senha muito curta"})
        }

        if(erros.length > 0){
            console.log(erros)
            //res.render("usuarios/cadastar", {erros: erros})
            //precisamos fazer com que a tela entrar aponte esses erros ao usuario
        } else {
            Usuario.findOne({email: req.body.mail}).then((usuario) => {
                if(usuario){
                    //req.flash("error_msg", "Já existe um usuário cadastrado com esse email")
                    res.redirect("/register")
                    //exibir a menesagem de erro
                } else {
                    const novoUsuario = new Usuario({
                        nome: req.body.user,
                        email: req.body.mail,
                        senha: req.body.senha 
                    }).save().then(() => {
                        console.log("Usúario salvo com sucesso")
                    }).catch((err) => {
                        res.status(422).json({ message: 'OCORREU UM ERORORRO!' })
                        console.log("Ocorreu um erro ao salvar o usúario"+err)
                    })
                    //req.flash("success_msg", "Usuário logado com sucesso")
                    
                    res.redirect("/login")
                    //exibir a mensagem de sucesso
                }
            }).catch((err) => {
                //req.flash("error_msg", "Houve um erro ao cadastrar")
                res.redirect("/register")
                //exibir a mensagem de erro  
            })
        }
    })


    app.post('/usuarios/compartilhar', async (req, res) =>{
        const mail = req.body.usuarioCompartilhado
        const pss = JSON.parse(req.body.selectViagens)
        const pessoas = pss["pessoas"].push(mail)
        const viagem = {$push: {viagens: JSON.stringify(pss)}}
        const pessoa = {$push: {pessoas: mail}}
        const id = req.user._id

        try {
            const updatedPersonAmigo = await Usuario.updateOne({ email: mail }, viagem)
            const updatedPerson = await Usuario.updateOne({ _id: id }, pessoa)
            if ((updatedPersonAmigo.matchedCount === 0) || (updatedPerson.matchedCount === 0)) {
              res.status(422).json({ message: 'Usuário não encontrado!' })
              return
            }
        
            res.redirect("/inicio")
          } catch (error) {
            res.status(500).json({ erro: error })
          }
    })

    app.post('/usuarios/atualizar', async (req, res) =>{

        const id = req.user._id

        const dados_novos = {
            nome: req.body.user_name,
            email: req.body.user_mail,
        }

        try {
            const updatedPerson = await Usuario.updateOne({ _id: id }, dados_novos)
        
            if (updatedPerson.matchedCount === 0) {
              res.status(422).json({ message: 'Usuário não encontrado!' })
              return
            }
        
            // req.flash("success_msg", "Usuário atualizado com sucesso")
            res.redirect("/inicio")
          } catch (error) {
            res.status(500).json({ erro: error })
          }
    })

    
    app.post('/usuarios/viagens', async (req, res) =>{

        const id = req.user._id

        const v1 = req.body.viagem1
        const v2 = req.body.viagem2
        const v3 = req.body.viagem3
        var dict = new Map()
        if (v1 != undefined) {
            dict.set("local", "Urubici")
            dict.set("data_ida", "05/10/2023")
            dict.set("data_volta", "09/10/2023")
            dict.set("guia_turistico", false)
            dict.set("hospedagem", true)
            dict.set("cafe_da_manha", true)
            dict.set("pessoas", [])
        }

        else if (v2 != undefined) {
            dict.set("local", "Cascata do Avencal")
            dict.set("data_ida", "07/04/2023")
            dict.set("data_volta", "12/04/2023")
            dict.set("guia_turistico", true)
            dict.set("hospedagem", true)
            dict.set("cafe_da_manha", false)
            dict.set("pessoas", [])
        }

        else {
            dict.set("local", "Serra do Rio do Rastro")
            dict.set("data_ida", "20/09/2023")
            dict.set("data_volta", "24/09/2023")
            dict.set("guia_turistico", true)
            dict.set("hospedagem", true)
            dict.set("cafe_da_manha", true)
            dict.set("pessoas", [])
        }
        

        const query = {
            $push: {viagens: dict}
        }

        try {
            const updatedPerson = await Usuario.updateOne({ _id: id }, query)
        
            if (updatedPerson.matchedCount === 0) {
              res.status(422).json({ message: 'Usuário não encontrado!' })
              return
            }
        
            // req.flash("success_msg", "Viagem adicionada")
            res.redirect("/inicio")
          } catch (error) {
            res.status(500).json({ erro: error })
          }
    })


    app.post('/usuarios/logar', function(req, res, next){
        passport.authenticate("local", {
            successRedirect: "/inicio",
            failureRedirect: "/login"
            //fazer as mensagens de erro 
        })(req, res, next)
    })

//MongoDB
// Credenciais
    const dbUser = process.env.DB_USER
    const dbPassword = process.env.DB_PASS
    mongoose.Promise = global.Promise
    mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.2vlgiyx.mongodb.net/?retryWrites=true&w=majority`, {
        useNewUrlParser: true
    }).then(() => {
        console.log("MongoDB Conectado!")
    }).catch((err) => {
        console.log("Houve um erro ao se conectar ao mongoDB"+err)
    })

const PORT = 3000
app.listen(PORT, function(){
    console.log("Servidor rodando!")
})

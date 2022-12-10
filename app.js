require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

// Config JSON response
app.use(express.json());
app.use(express.static( "public" ) );
app.set("view engine", "ejs");
// Models
const User = require('./models/User')

// Rota publica
app.get('/', (req, res) => {
    res.render("index"); // para direcionar para paginas ejs/html
})

app.get('/register', (req, res) => {
    res.render("register");
})

app.get('/login', (req, res) => {
    res.render("login");
})

// Rota privada
app.get("/user/:id", checkToken, async (req, res) => {

    const id = req.params.id

    // check if user exists
    const user = await User.findById(id, '-password')

    if (!user) {
        return res.status(404).json({msg: 'Usuário não encontrado!'})
    }

    res.status(200).json({ user })
})

function checkToken(req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({msg: 'Acesso negado'})
    }

    try{
        const secret = process.env.SECRET
        jwt.verify(token, secret)
        next()

    } catch(error){
        res.status(400).json({msg: 'Token inválido'})
    }
}

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
// Registrar usuario
app.post('/auth/register', async(req, res) => {

    const body = req.body;
    const name = body.user;
    const email = body.mail;
    const password = body.senha;
    const confirmpassword = body.confirmsenha;

    // validacoes
    if(!name) {
        return res.status(422).json({msg: 'O nome é obrigatório'})
    }

    if(!email) {
        return res.status(422).json({msg: 'O email é obrigatório'})
    }

    if(!password) {
        return res.status(422).json({msg: 'A senha é obrigatória'})
    }

    // checar se as senhas batem
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem'})
    }

    // checar se usuario já existe
    const userExists = await User.findOne({ email: email})

    if(userExists){
        return res.status(422).json({msg: 'Email já está em uso, favor utilizar outro'})
    }

    // create password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // create user
    const user = new User({
        name,
        email,
        password: passwordHash,
    })
    try {
        await user.save()
        res.send('POST: Nome: ' + name + ', email: ' + email)
        // res.render('pagina_que_decidirmos_apos_cadastro')
        res.status(201).json({msg: 'Usuário criado com sucesso'})
    } catch(error) {
        console.log(error)

        res.status(500).json({msg: 'Aconteceu um erro no servidor. Favor tentar novamente mais tarde!',
    })
    }
})

// Login User
app.post("/auth/login", async (req, res) => {
    const body = req.body;
    const email = body.mail;
    const password = body.senha;

    // validations
    if(!email) {
        return res.status(422).json({msg: 'Favor informar o email'})
    }

    if(!password) {
        return res.status(422).json({msg: 'Favor informar a senha'})
    }

    // check if user exists
    const user = await User.findOne({ email: email})

    if (!user) {
        return res.status(404).json({msg: 'Usuário não encontrado'})
    }

    // check if user and password match
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({msg: 'Senha inválida'})
    }

    try{
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
            id: user._id,
            },
            secret,
        )

        res.status(200).json({msg: 'Autenticação realizada com sucesso!', token})

    } catch(err){
        console.log(err)

        res.status(500).json({msg: 'Aconteceu um erro no servidor. Favor tentar novamente mais tarde!',
    })
    }

})

// Credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.2vlgiyx.mongodb.net/?retryWrites=true&w=majority`,).then( () => {
    app.listen(3000)
    console.log('Conectou ao banco!')
})
.catch((err) => console.log(err))

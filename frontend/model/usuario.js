//Carregando o mongodb
const mongoose = require("mongoose")
const Schema = mongoose.Schema;

//Definindo o model, no caso usuario e seus atributos
const Usuario = new Schema({
    nome: {type: String},
    email: {type: String},
    senha: {type: String},
    viagens: {type: []}
})

/* function update(id, novos_dados){
    Usuario.nome = novos_dados["nome"];
    Usuario.email = novos_dados["email"]
} */
//Collection (como se fosse uma tabela)
mongoose.model('users', Usuario)

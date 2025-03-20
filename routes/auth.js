const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/config');

router.post('/login', async (req, res) => {
    const { matricula, contraseña } = req.body;
    
    try {
        // Buscar usuario por matrícula
        const user = await db.oneOrNone('SELECT * FROM usuarios WHERE matricula = $1', [matricula]);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(contraseña, user.contraseña);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id,
                matricula: user.matricula,
                tipo_usuario: user.tipo_usuario
            },
            'tu_secreto_jwt', // TODO: Mover a variables de entorno
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                matricula: user.matricula,
                nombres: user.nombres,
                apellido_paterno: user.apellido_paterno,
                tipo_usuario: user.tipo_usuario
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
});

module.exports = router;

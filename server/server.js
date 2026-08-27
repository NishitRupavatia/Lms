import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebHooks } from './controllers/webhooks.js'

const app = express()

// CORS Middleware
app.use(cors())

// Ensure MongoDB is connected before any route runs.
// On serverless the connection is cached, so this is a no-op after the cold start.
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        console.error('Database connection error:', error)
        res.status(500).json({ success: false, message: 'Database connection failed' })
    }
})

// Clerk Webhook Route (requires raw body for Svix signature verification)
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebHooks)

// Standard JSON parser middleware for all subsequent routes
app.use(express.json())

// Default Route
app.get('/', (req, res) => res.send("API working"))

// Only listen locally — on Vercel the exported app is invoked as a serverless function
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

export default app

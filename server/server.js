import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebHooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// CORS Middleware
app.use(cors())
app.use(clerkMiddleware())

// Strip any credentials before an error message is returned to the client
const safeMessage = (error) =>
    String(error?.message || error).replace(/\/\/[^@\s]+@/g, '//<credentials>@')

// Diagnostics: reports configuration state without exposing any secret values
app.get('/health', async (req, res) => {
    const state = ['disconnected', 'connected', 'connecting', 'disconnecting']
    let dbError = null

    try {
        await connectDB()
    } catch (error) {
        dbError = safeMessage(error)
    }

    res.json({
        ok: !dbError,
        env: {
            MONGODB_URI: !!process.env.MONGODB_URI,
            CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET,
        },
        mongoose: state[mongoose.connection.readyState] ?? mongoose.connection.readyState,
        dbError,
    })
})

// Ensure MongoDB is connected before any route runs.
// On serverless the connection is cached, so this is a no-op after the cold start.
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        console.error('Database connection error:', error)
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            reason: safeMessage(error),
        })
    }
})

// Clerk Webhook Route (requires raw body for Svix signature verification)
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebHooks)

// Standard JSON parser middleware for all subsequent routes
app.use(express.json())

// Default Route
app.get('/', (req, res) => res.send("API working"))
app.use('/api/educator', educatorRouter)

// Only listen locally — on Vercel the exported app is invoked as a serverless function
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

export default app

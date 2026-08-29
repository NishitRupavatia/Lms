/**
 * Seeds the catalogue with a set of SDE and ML courses.
 *
 *   node scripts/seedCourses.js            insert (skips titles that already exist)
 *   node scripts/seedCourses.js --remove   delete everything this script created
 *
 * Thumbnails are generated as SVG files into `server/uploads` and served by the
 * API, so no Cloudinary account is needed. Lecture videos point at real,
 * publicly available YouTube lessons that were checked to be embeddable.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import connectDB from '../configs/mongodb.js'
import { UPLOAD_DIR } from '../configs/multer.js'
import Course from '../models/Course.js'
import User from '../models/User.js'

const BASE_URL = process.env.SEED_BASE_URL || `http://localhost:${process.env.PORT || 5000}`

// Verified embeddable lessons, reused across courses as stand-in lecture videos
const VIDEO = {
    dsaFull: 'https://www.youtube.com/watch?v=8hly31xKli0',
    dsaAdvanced: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
    interview: 'https://www.youtube.com/watch?v=GJdiM-muYqc',
    csIntro: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    python: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    node: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
    docker: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
    kubernetes: 'https://www.youtube.com/watch?v=X48VuDVv0do',
    dataAnalysis: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
    pandas: 'https://www.youtube.com/watch?v=vmEHCJofslg',
    dataScience: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
    nnIntro: 'https://www.youtube.com/watch?v=aircAruvnKk',
    gradientDescent: 'https://www.youtube.com/watch?v=IHZwWFHWa-w',
    backprop: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
    transformers: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
}

// [chapter title, [[lecture title, minutes, video], ...]]
const courses = [
    {
        title: 'Data Structures and Algorithms in Java',
        price: 149.99,
        discount: 78,
        accent: ['#f97316', '#b91c1c'],
        tag: 'Software Engineering',
        summary: 'Build the problem-solving foundation every backend and product interview is built on, from arrays through graphs and dynamic programming.',
        outcomes: [
            'Reason about time and space complexity before writing a line of code',
            'Implement every core structure from scratch rather than reaching for a library',
            'Recognise which of the standard patterns a new problem belongs to',
            'Work through problems the way an interviewer expects you to talk through them',
        ],
        chapters: [
            ['Complexity and Arrays', [
                ['Why complexity analysis comes first', 14, VIDEO.dsaFull, true],
                ['Big-O, Big-Theta and amortised cost', 22, VIDEO.dsaFull],
                ['Two pointers and the sliding window', 26, VIDEO.dsaFull],
            ]],
            ['Linked Lists, Stacks and Queues', [
                ['Singly and doubly linked lists', 24, VIDEO.dsaAdvanced],
                ['Stacks, queues and the monotonic stack', 21, VIDEO.dsaAdvanced],
                ['Cycle detection and in-place reversal', 19, VIDEO.dsaAdvanced],
            ]],
            ['Trees and Graphs', [
                ['Binary trees and traversal orders', 27, VIDEO.dsaAdvanced],
                ['Binary search trees and balancing', 31, VIDEO.dsaAdvanced],
                ['BFS, DFS and shortest paths', 34, VIDEO.dsaFull],
            ]],
            ['Dynamic Programming', [
                ['Memoisation versus tabulation', 25, VIDEO.dsaFull],
                ['Knapsack, subsequences and grids', 33, VIDEO.dsaFull],
                ['Walking through a real interview problem', 18, VIDEO.interview],
            ]],
        ],
    },
    {
        title: 'System Design Interview Preparation',
        price: 199.99,
        discount: 75,
        accent: ['#0ea5e9', '#1e3a8a'],
        tag: 'Software Engineering',
        summary: 'Learn to take a vague prompt like "design a URL shortener" and turn it into a defensible architecture with explicit trade-offs.',
        outcomes: [
            'Drive a design discussion instead of waiting to be prompted',
            'Estimate load and storage well enough to justify your choices',
            'Explain when to reach for caching, sharding, queues or replication',
            'Recognise the failure modes an interviewer is listening for',
        ],
        chapters: [
            ['Foundations', [
                ['What system design interviews actually assess', 16, VIDEO.csIntro, true],
                ['Latency, throughput and back-of-envelope estimation', 23, VIDEO.csIntro],
                ['Consistency, availability and partition tolerance', 28, VIDEO.csIntro],
            ]],
            ['Building Blocks', [
                ['Load balancing and reverse proxies', 22, VIDEO.kubernetes],
                ['Caching strategies and invalidation', 26, VIDEO.kubernetes],
                ['Databases: replication, sharding and indexes', 32, VIDEO.node],
                ['Message queues and asynchronous processing', 24, VIDEO.node],
            ]],
            ['Case Studies', [
                ['Designing a URL shortener', 29, VIDEO.csIntro],
                ['Designing a news feed', 34, VIDEO.csIntro],
                ['Designing a rate limiter', 21, VIDEO.csIntro],
            ]],
        ],
    },
    {
        title: 'Full Stack Web Development with the MERN Stack',
        price: 179.99,
        discount: 80,
        accent: ['#22c55e', '#065f46'],
        tag: 'Web Development',
        summary: 'Build and ship a complete production-shaped application: React on the front, Express and MongoDB behind it, with real authentication and payments.',
        outcomes: [
            'Structure a React application that stays readable past ten screens',
            'Design REST endpoints and model data in MongoDB',
            'Wire up third-party authentication and a payment provider',
            'Deploy the whole thing and debug it once it is live',
        ],
        chapters: [
            ['Frontend Foundations', [
                ['Project setup and tooling', 18, VIDEO.node, true],
                ['Components, props and state', 26, VIDEO.node],
                ['Routing and shared context', 24, VIDEO.node],
            ]],
            ['Backend and Database', [
                ['Express routing and middleware', 27, VIDEO.node],
                ['Modelling data with Mongoose', 29, VIDEO.node],
                ['File uploads and media handling', 21, VIDEO.node],
            ]],
            ['Auth, Payments and Deployment', [
                ['Sessions, tokens and protected routes', 30, VIDEO.node],
                ['Taking payments with a checkout provider', 28, VIDEO.node],
                ['Webhooks and asynchronous confirmation', 22, VIDEO.node],
                ['Deploying the client and the API', 19, VIDEO.docker],
            ]],
        ],
    },
    {
        title: 'Advanced React Patterns and Performance',
        price: 129.99,
        discount: 70,
        accent: ['#38bdf8', '#0c4a6e'],
        tag: 'Web Development',
        summary: 'Move past tutorials into the patterns that keep large React codebases fast and maintainable, and learn to measure before you optimise.',
        outcomes: [
            'Choose the right composition pattern for a given problem',
            'Read a flame graph and find the render that actually costs you',
            'Understand when memoisation helps and when it is noise',
            'Handle data fetching, caching and suspense deliberately',
        ],
        chapters: [
            ['Component Patterns', [
                ['Composition over configuration', 20, VIDEO.node, true],
                ['Custom hooks and shared logic', 25, VIDEO.node],
                ['Context without the re-render tax', 23, VIDEO.node],
            ]],
            ['Rendering and Performance', [
                ['How React decides to re-render', 27, VIDEO.node],
                ['Profiling with the DevTools flame graph', 24, VIDEO.node],
                ['Virtualising long lists', 19, VIDEO.node],
            ]],
            ['Data and State', [
                ['Server state versus client state', 26, VIDEO.node],
                ['Optimistic updates and rollback', 22, VIDEO.node],
            ]],
        ],
    },
    {
        title: 'Backend Engineering with Node.js and PostgreSQL',
        price: 139.99,
        discount: 72,
        accent: ['#84cc16', '#3f6212'],
        tag: 'Backend',
        summary: 'Design APIs that survive contact with real traffic: proper schema design, transactions, indexing, background jobs and observability.',
        outcomes: [
            'Model a relational schema that will not fight you later',
            'Write queries that use indexes instead of table scans',
            'Handle transactions, retries and idempotency correctly',
            'Instrument a service so production problems are diagnosable',
        ],
        chapters: [
            ['API Design', [
                ['REST conventions that pay off', 19, VIDEO.node, true],
                ['Validation and error handling', 24, VIDEO.node],
                ['Authentication and authorisation', 28, VIDEO.node],
            ]],
            ['Relational Data', [
                ['Schema design and normalisation', 30, VIDEO.node],
                ['Indexes and query planning', 27, VIDEO.node],
                ['Transactions and isolation levels', 25, VIDEO.node],
            ]],
            ['Running in Production', [
                ['Background jobs and scheduling', 23, VIDEO.node],
                ['Logging, metrics and tracing', 21, VIDEO.docker],
            ]],
        ],
    },
    {
        title: 'Python for Software Engineers',
        price: 89.99,
        discount: 68,
        accent: ['#facc15', '#a16207'],
        tag: 'Programming',
        summary: 'A Python course written for people who already program: idiomatic style, the data model, testing, packaging and the standard library.',
        outcomes: [
            'Write Python that reads like Python rather than translated Java',
            'Use the data model — iterators, context managers, dunder methods',
            'Test and package code so others can actually run it',
            'Know which part of the standard library already solved your problem',
        ],
        chapters: [
            ['Idiomatic Python', [
                ['Types, sequences and comprehensions', 22, VIDEO.python, true],
                ['Functions, closures and decorators', 27, VIDEO.python],
                ['Classes and the data model', 29, VIDEO.python],
            ]],
            ['Practical Tooling', [
                ['Virtual environments and dependencies', 17, VIDEO.python],
                ['Testing with pytest', 24, VIDEO.python],
                ['Type hints and static checking', 20, VIDEO.python],
            ]],
            ['Standard Library Tour', [
                ['Files, paths and serialisation', 21, VIDEO.python],
                ['Concurrency: threads, processes and asyncio', 31, VIDEO.python],
            ]],
        ],
    },
    {
        title: 'Docker and Kubernetes for Developers',
        price: 159.99,
        discount: 76,
        accent: ['#2563eb', '#1e1b4b'],
        tag: 'DevOps',
        summary: 'Containerise a real application and run it on Kubernetes, with a clear picture of what each layer is actually doing.',
        outcomes: [
            'Write Dockerfiles that build fast and stay small',
            'Compose multi-service environments for local development',
            'Deploy, scale and roll back workloads on Kubernetes',
            'Debug a pod that will not start',
        ],
        chapters: [
            ['Containers', [
                ['What a container actually is', 18, VIDEO.docker, true],
                ['Writing and layering a Dockerfile', 26, VIDEO.docker],
                ['Volumes, networks and Compose', 24, VIDEO.docker],
            ]],
            ['Kubernetes Basics', [
                ['Pods, deployments and services', 29, VIDEO.kubernetes],
                ['ConfigMaps, secrets and environment', 22, VIDEO.kubernetes],
                ['Ingress and exposing traffic', 25, VIDEO.kubernetes],
            ]],
            ['Operating Clusters', [
                ['Health checks and rolling updates', 23, VIDEO.kubernetes],
                ['Resource limits and autoscaling', 27, VIDEO.kubernetes],
            ]],
        ],
    },
    {
        title: 'AWS for Developers: From Fundamentals to Solutions Architecture',
        price: 189.99,
        discount: 74,
        accent: ['#fb923c', '#7c2d12'],
        tag: 'Cloud',
        summary: 'Work through the AWS services you will actually touch, and learn to assemble them into architectures that are cheap, secure and resilient.',
        outcomes: [
            'Navigate IAM without granting everyone administrator access',
            'Choose between EC2, containers and serverless for a workload',
            'Design storage and database layers that match the access pattern',
            'Reason about cost and blast radius before you provision',
        ],
        chapters: [
            ['Core Services', [
                ['Regions, availability zones and IAM', 21, VIDEO.docker, true],
                ['Compute: EC2, ECS and Lambda', 30, VIDEO.docker],
                ['Storage: S3, EBS and lifecycle rules', 25, VIDEO.docker],
            ]],
            ['Data and Networking', [
                ['VPCs, subnets and security groups', 28, VIDEO.kubernetes],
                ['RDS, DynamoDB and picking between them', 26, VIDEO.kubernetes],
            ]],
            ['Architecting', [
                ['High availability and failover', 24, VIDEO.kubernetes],
                ['Cost optimisation in practice', 20, VIDEO.kubernetes],
            ]],
        ],
    },
    {
        title: 'Git, CI/CD and DevOps Fundamentals',
        price: 79.99,
        discount: 65,
        accent: ['#f43f5e', '#881337'],
        tag: 'DevOps',
        summary: 'Get genuinely comfortable with Git — including the parts that scare people — then automate build, test and deploy around it.',
        outcomes: [
            'Understand Git as a graph, so rebase and reset stop being scary',
            'Recover from mistakes instead of deleting the repo and re-cloning',
            'Set up pipelines that catch problems before review does',
            'Automate releases with confidence in the rollback path',
        ],
        chapters: [
            ['Git in Depth', [
                ['Commits, branches and the object graph', 20, VIDEO.csIntro, true],
                ['Merge, rebase and when each is right', 26, VIDEO.csIntro],
                ['Undoing things: reset, revert and reflog', 23, VIDEO.csIntro],
            ]],
            ['Collaboration', [
                ['Branching strategies for real teams', 19, VIDEO.csIntro],
                ['Code review that is worth the time', 17, VIDEO.csIntro],
            ]],
            ['Automation', [
                ['Continuous integration pipelines', 25, VIDEO.docker],
                ['Deployment strategies and rollbacks', 22, VIDEO.docker],
            ]],
        ],
    },
    {
        title: 'Low Level Design and Design Patterns in C++',
        price: 119.99,
        discount: 70,
        accent: ['#a855f7', '#4c1d95'],
        tag: 'Software Engineering',
        summary: 'Turn a written requirement into classes, responsibilities and interfaces — the machine-coding round most candidates are least prepared for.',
        outcomes: [
            'Apply SOLID principles without turning them into dogma',
            'Recognise the pattern a problem is quietly asking for',
            'Design for extension without over-engineering the first version',
            'Produce working, testable code inside an interview time limit',
        ],
        chapters: [
            ['Object Oriented Foundations', [
                ['Responsibilities and coupling', 21, VIDEO.dsaAdvanced, true],
                ['The SOLID principles in practice', 28, VIDEO.dsaAdvanced],
            ]],
            ['Design Patterns', [
                ['Creational: factory, builder, singleton', 27, VIDEO.dsaAdvanced],
                ['Structural: adapter, decorator, composite', 26, VIDEO.dsaAdvanced],
                ['Behavioural: strategy, observer, state', 29, VIDEO.dsaAdvanced],
            ]],
            ['Machine Coding Practice', [
                ['Designing a parking lot', 32, VIDEO.interview],
                ['Designing an elevator system', 30, VIDEO.interview],
            ]],
        ],
    },
    {
        title: 'Machine Learning Foundations with scikit-learn',
        price: 169.99,
        discount: 77,
        accent: ['#14b8a6', '#134e4a'],
        tag: 'Machine Learning',
        summary: 'The mathematics and the practice together: how the standard algorithms work, and how to evaluate a model honestly.',
        outcomes: [
            'Explain what a model is optimising, not just which function to call',
            'Build pipelines that do not leak information from the test set',
            'Choose metrics that match the problem rather than the default',
            'Diagnose overfitting and underfitting from learning curves',
        ],
        chapters: [
            ['Supervised Learning', [
                ['The learning problem and loss functions', 24, VIDEO.dataScience, true],
                ['Linear and logistic regression', 29, VIDEO.dataScience],
                ['Decision trees and ensembles', 31, VIDEO.dataScience],
            ]],
            ['Model Evaluation', [
                ['Train, validation and test splits', 22, VIDEO.dataScience],
                ['Precision, recall and the cost of errors', 26, VIDEO.dataScience],
                ['Cross validation and hyperparameter search', 28, VIDEO.dataScience],
            ]],
            ['Unsupervised Learning', [
                ['Clustering with k-means', 23, VIDEO.dataScience],
                ['Dimensionality reduction with PCA', 25, VIDEO.dataScience],
            ]],
        ],
    },
    {
        title: 'Deep Learning with PyTorch',
        price: 199.99,
        discount: 78,
        accent: ['#ef4444', '#7f1d1d'],
        tag: 'Machine Learning',
        summary: 'Build neural networks from the tensor up, with a real understanding of autograd, backpropagation and why training goes wrong.',
        outcomes: [
            'Explain forward and backward passes without hand-waving',
            'Write custom layers, losses and training loops',
            'Recognise vanishing gradients, dead units and bad initialisation',
            'Train convolutional and recurrent architectures on real data',
        ],
        chapters: [
            ['Neural Network Basics', [
                ['What a neural network is', 19, VIDEO.nnIntro, true],
                ['Gradient descent and how networks learn', 21, VIDEO.gradientDescent],
                ['Backpropagation, intuitively', 24, VIDEO.backprop],
            ]],
            ['Working in PyTorch', [
                ['Tensors, devices and autograd', 27, VIDEO.nnIntro],
                ['Datasets, loaders and the training loop', 30, VIDEO.nnIntro],
                ['Regularisation and normalisation', 25, VIDEO.gradientDescent],
            ]],
            ['Architectures', [
                ['Convolutional networks for vision', 33, VIDEO.nnIntro],
                ['Sequence models and attention', 31, VIDEO.transformers],
            ]],
        ],
    },
    {
        title: 'Natural Language Processing with Transformers',
        price: 189.99,
        discount: 76,
        accent: ['#8b5cf6', '#2e1065'],
        tag: 'Machine Learning',
        summary: 'From tokenisation to fine-tuning: how transformer models represent language, and how to adapt a pretrained one to your own task.',
        outcomes: [
            'Explain self-attention and why it replaced recurrence',
            'Tokenise text without silently corrupting your inputs',
            'Fine-tune a pretrained model on a modest dataset',
            'Evaluate generated text with appropriate metrics',
        ],
        chapters: [
            ['Representing Language', [
                ['Tokenisation and subword vocabularies', 23, VIDEO.transformers, true],
                ['Embeddings and semantic similarity', 26, VIDEO.transformers],
            ]],
            ['The Transformer', [
                ['Self-attention from first principles', 32, VIDEO.transformers],
                ['Multi-head attention and positional encoding', 29, VIDEO.transformers],
                ['Encoder, decoder and encoder-decoder models', 27, VIDEO.transformers],
            ]],
            ['Applying Pretrained Models', [
                ['Fine-tuning for classification', 28, VIDEO.nnIntro],
                ['Retrieval augmented generation', 30, VIDEO.transformers],
            ]],
        ],
    },
    {
        title: 'MLOps: Deploying and Monitoring Machine Learning Models',
        price: 149.99,
        discount: 73,
        accent: ['#06b6d4', '#164e63'],
        tag: 'Machine Learning',
        summary: 'The half of machine learning that happens after the notebook: packaging, serving, versioning and noticing when a model quietly stops working.',
        outcomes: [
            'Package a model and serve it behind a real API',
            'Version data, code and models so results are reproducible',
            'Detect data drift and degrading performance in production',
            'Build retraining pipelines that do not require heroics',
        ],
        chapters: [
            ['From Notebook to Service', [
                ['Why models fail after deployment', 20, VIDEO.dataScience, true],
                ['Packaging and serving a model', 27, VIDEO.docker],
                ['Batch versus real-time inference', 23, VIDEO.docker],
            ]],
            ['Reproducibility', [
                ['Experiment tracking and model registries', 25, VIDEO.dataScience],
                ['Versioning data and features', 24, VIDEO.dataScience],
            ]],
            ['Monitoring', [
                ['Detecting data and concept drift', 26, VIDEO.dataScience],
                ['Automated retraining pipelines', 28, VIDEO.kubernetes],
            ]],
        ],
    },
    {
        title: 'Data Analysis with Pandas, NumPy and SQL',
        price: 99.99,
        discount: 70,
        accent: ['#10b981', '#064e3b'],
        tag: 'Data',
        summary: 'Get fluent with the three tools every data role assumes you already know, working on messy data rather than tidy examples.',
        outcomes: [
            'Reshape, join and aggregate data without fighting the API',
            'Write SQL that answers analytical questions efficiently',
            'Clean real data with missing values and inconsistent types',
            'Communicate a finding with a chart that makes the point',
        ],
        chapters: [
            ['NumPy and Pandas', [
                ['Arrays, vectorisation and broadcasting', 24, VIDEO.dataAnalysis, true],
                ['Series, DataFrames and indexing', 28, VIDEO.pandas],
                ['Grouping, joining and reshaping', 31, VIDEO.pandas],
            ]],
            ['SQL for Analysis', [
                ['Joins, aggregation and subqueries', 27, VIDEO.dataAnalysis],
                ['Window functions', 25, VIDEO.dataAnalysis],
            ]],
            ['Cleaning and Communicating', [
                ['Missing data and type coercion', 22, VIDEO.pandas],
                ['Visualising a result honestly', 20, VIDEO.dataAnalysis],
            ]],
        ],
    },
]

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Greedy wrap so the title fits the card without a text-layout engine
const wrap = (text, max) => {
    const lines = []
    let line = ''
    for (const word of text.split(' ')) {
        if ((line + ' ' + word).trim().length > max) {
            lines.push(line.trim())
            line = word
        } else {
            line = (line + ' ' + word).trim()
        }
    }
    if (line) lines.push(line)
    return lines.slice(0, 4)
}

const buildThumbnail = (course) => {
    const [from, to] = course.accent
    const lines = wrap(course.title, 24)
    const startY = 180 - (lines.length - 1) * 24

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="${escapeXml(course.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <circle cx="560" cy="60" r="130" fill="#ffffff" opacity="0.08"/>
  <circle cx="70" cy="320" r="90" fill="#ffffff" opacity="0.06"/>
  <text x="40" y="62" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="#ffffff" opacity="0.75" letter-spacing="2">${escapeXml(course.tag.toUpperCase())}</text>
${lines.map((l, i) => `  <text x="40" y="${startY + i * 48}" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff">${escapeXml(l)}</text>`).join('\n')}
  <rect x="40" y="300" width="64" height="5" rx="2.5" fill="#ffffff" opacity="0.85"/>
</svg>
`
    const filename = `seed-${slugify(course.title)}.svg`
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), svg, 'utf8')
    return `${BASE_URL}/uploads/${filename}`
}

const buildDescription = (course) => `<p>${course.summary}</p>
<h3>What you will learn</h3>
<ul>
${course.outcomes.map((o) => `<li>${o}</li>`).join('\n')}
</ul>
<h3>Who this is for</h3>
<p>Developers and students who want depth rather than a tour. Every section builds towards work you could put in front of an interviewer or a reviewer.</p>`

const buildCourse = (course, educator) => ({
    courseTitle: course.title,
    courseDescription: buildDescription(course),
    courseThumbnail: buildThumbnail(course),
    coursePrice: course.price,
    discount: course.discount,
    isPublished: true,
    educator,
    enrolledStudents: [],
    courseRatings: [],
    courseContent: course.chapters.map(([chapterTitle, lectures], ci) => ({
        chapterId: `${slugify(course.title)}-c${ci + 1}`,
        chapterOrder: ci + 1,
        chapterTitle,
        chapterContent: lectures.map(([lectureTitle, minutes, url, preview], li) => ({
            lectureId: `${slugify(course.title)}-c${ci + 1}-l${li + 1}`,
            lectureTitle,
            lectureDuration: minutes,
            lectureUrl: url,
            // First lecture of the first chapter is the free preview
            isPreviewFree: Boolean(preview),
            lectureOrder: li + 1,
        })),
    })),
})

const run = async () => {
    await connectDB()

    const titles = courses.map((c) => c.title)
    const remove = process.argv.includes('--remove')

    if (remove) {
        const { deletedCount } = await Course.deleteMany({ courseTitle: { $in: titles } })

        for (const course of courses) {
            const file = path.join(UPLOAD_DIR, `seed-${slugify(course.title)}.svg`)
            fs.rmSync(file, { force: true })
        }

        console.log(`Removed ${deletedCount} seeded course(s) and their thumbnails.`)
        await mongoose.disconnect()
        return
    }

    // Attribute the courses to the existing educator, whoever that is
    const existing = await Course.findOne().sort({ createdAt: 1 })
    const educator = existing?.educator || (await User.findOne())?._id

    if (!educator) {
        console.error('No educator found. Sign in and click "Become Educator" first.')
        await mongoose.disconnect()
        process.exitCode = 1
        return
    }

    const alreadyThere = new Set(
        (await Course.find({ courseTitle: { $in: titles } }).select('courseTitle'))
            .map((c) => c.courseTitle)
    )

    const toInsert = courses
        .filter((c) => !alreadyThere.has(c.title))
        .map((c) => buildCourse(c, educator))

    if (toInsert.length === 0) {
        console.log('All seeded courses are already present, nothing to do.')
    } else {
        await Course.insertMany(toInsert)
        console.log(`Inserted ${toInsert.length} course(s), attributed to ${educator}:`)
        for (const c of toInsert) {
            const net = (c.coursePrice - (c.discount * c.coursePrice) / 100).toFixed(2)
            const lectures = c.courseContent.reduce((n, ch) => n + ch.chapterContent.length, 0)
            console.log(`  ${c.courseTitle}`)
            console.log(`     $${c.coursePrice} - ${c.discount}% = $${net}   ${c.courseContent.length} chapters / ${lectures} lectures`)
        }
    }

    if (alreadyThere.size) {
        console.log(`Skipped ${alreadyThere.size} already present.`)
    }

    console.log(`\nTotal courses in catalogue: ${await Course.countDocuments()}`)
    await mongoose.disconnect()
}

run().catch(async (error) => {
    console.error('Seed failed:', error.message)
    await mongoose.disconnect().catch(() => { })
    process.exitCode = 1
})

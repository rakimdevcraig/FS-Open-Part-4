const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
  const blog = await Blog.findById(request.params.id).populate('user', {
    username: 1,
    name: 1,
  })
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post(
  '/',
  middleware.userExtractor,
  async (request, response, next) => {
    const body = request.body
    const user = request.user
    // const token = request.token

    if (
      !body.title ||
      body.title.trim() === '' ||
      !body.url ||
      body.url.trim() === ''
    ) {
      response.status(400).end()
    }

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.number || 0,
      user: user._id,
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
  }
)

blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response, next) => {
    const user = request.user
    const token = request.token

    const blogToDelete = await Blog.findById(request.params.id).populate(
      'user',
      {
        username: 1,
        name: 1,
      }
    )

    if (!blogToDelete) {
      return response.status(400).end()
    }

    const blogCreator = blogToDelete.user._id.toString()
    const userDeleting = user._id.toString()
    // console.log(token, blogCreator, userDeleting)
    console.log('creator ', blogCreator)
    console.log('deleter ', userDeleting)
    if (!token || blogCreator !== userDeleting) {
      response.status(401).json({ error: 'token missing or invalid' })
    }
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  }
)

blogsRouter.put(
  '/:id',
  middleware.userExtractor,
  async (request, response, next) => {
    const body = request.body

    const blog = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true,
    })
    response.json(updatedBlog)
  }
)

module.exports = blogsRouter

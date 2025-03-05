const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('Get Blogs', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('there are two blogs', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, 2)
  })

  test('the identifiying field of every blog is id instead of _id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body
    const hasId = blogs[0].hasOwnProperty('id')
    assert.strictEqual(hasId, true)
  })
})

describe(' when adding a blog', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })
  test('a valid blog can be added', async () => {
    const user = {
      username: 'root',
      password: 'sekret',
    }
    const loginResponse = await api.post('/api/login').send(user).expect(200)

    const token = loginResponse.body.token

    const newBlog = {
      title: 'Tatum 4 mvp',
      author: 'Celticsfan1',
      url: 'nba.com',
      likes: 18,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    const titles = response.body.map((r) => r.title)

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

    assert(titles.includes('Tatum 4 mvp'))
  })

  test('if likes isnt specified it defaults to 0', async () => {
    const user = {
      username: 'root',
      password: 'sekret',
    }
    const loginResponse = await api.post('/api/login').send(user).expect(200)

    const token = loginResponse.body.token

    const newBlog = {
      title: 'No likes ',
      author: 'negative nancy',
      url: 'nolikes.com',
      likes: '',
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)

      .send(newBlog)

    const response = await api.get('/api/blogs')
    const responseBody = response.body
    const likesTotal = responseBody[responseBody.length - 1].likes

    assert.strictEqual(likesTotal, 0)
  })

  test('if there is no title or URL we get a 400 response', async () => {
    const user = {
      username: 'root',
      password: 'sekret',
    }
    const loginResponse = await api.post('/api/login').send(user).expect(200)

    const token = loginResponse.body.token

    const newBlog = {
      author: 'Author who doesnt like titles',
      likes: 20,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)
  })
})

describe('when deleting a blog', () => {
  test('a blog can be deleted', async () => {
    await Blog.deleteMany({})

    const user = {
      username: 'root',
      password: 'sekret',
    }
    const loginResponse = await api.post('/api/login').send(user).expect(200)

    const token = loginResponse.body.token

    const newBlog1 = {
      title: 'Tatum 4 mvp',
      author: 'Celticsfan1',
      url: 'nba.com',
      likes: 18,
    }

    const newBlog2 = {
      title: 'Blog 2',
      author: 'im not a writer',
      url: 'nba.com',
      likes: 10,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog1)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog2)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterAdd = await api.get('/api/blogs')
    const blogToDelete = blogsAfterAdd.body[0]
    console.log('after add ', blogsAfterAdd)
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAfterDelete = await api.get('/api/blogs')
    console.log('after delete ', blogsAfterDelete.body)
    const title = blogsAfterDelete.body.map((r) => r.title)
    assert(!title.includes(blogToDelete.title))

    assert.strictEqual(
      blogsAfterDelete.body.length,
      blogsAfterAdd.body.length - 1
    )
  })
})

describe('when editing a blog', () => {
  test('a blog can be edited', async () => {
    await Blog.deleteMany({})

    const user = {
      username: 'root',
      password: 'sekret',
    }
    const loginResponse = await api.post('/api/login').send(user).expect(200)

    const token = loginResponse.body.token

    const newBlog1 = {
      title: 'Tatum 4 mvp',
      author: 'Celticsfan1',
      url: 'nba.com',
      likes: 18,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog1)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterAdd = await api.get('/api/blogs')

    const unEditedBlog = blogsAfterAdd.body[0]

    const newBlog = {
      title: unEditedBlog.title, // Ensure you include all required fields
      author: unEditedBlog.author,
      url: unEditedBlog.url,
      likes: unEditedBlog.likes + 1,
    }

    const response = await api
      .put(`/api/blogs/${unEditedBlog.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(200) // Expect a 200 OK response on successful update

    const blogsAfterUpdate = await api.get('/api/blogs')
    const updatedBlog = blogsAfterUpdate.body[0]

    assert.strictEqual(updatedBlog.likes, unEditedBlog.likes + 1)
  })
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
  test.only('creation fails if username is too short', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api.post('/api/users').send(newUser).expect(400)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('username or password is too short'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})
after(async () => {
  await mongoose.connection.close()
})

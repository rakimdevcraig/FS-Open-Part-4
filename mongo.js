const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://rakimdevcraig:${password}@cluster0.y4nji.mongodb.net/testblogsapp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery', false)
mongoose.connect(url).then(() => {
  const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number,
  })

  const Blog = mongoose.model('Blog', blogSchema)

  const blog = new Blog({
    title: 'Draft News',
    author: 'Adam Schefter',
    url: 'espn.com',
    likes: 19,
  })

  blog.save().then((result) => {
    console.log('blog saved!')
    mongoose.connection.close()
  })

  // Blog.find({}).then((result) => {
  //   result.forEach((blog) => {
  //     console.log(blog)
  //   })
  //   mongoose.connection.close()
  // })
})

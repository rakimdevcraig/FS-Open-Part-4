const dummy = (blogs) => {
  return 1
}

const totalLikes = (array) => {
  let likes = 0
  for (let blog of array) {
    likes = likes + blog.likes
  }

  return array.length === 0 ? 0 : likes
}

module.exports = {
  dummy,
  totalLikes,
}

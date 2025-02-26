const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const likesReduced = blogs.reduce((acc, cur) => {
    return acc + cur.likes
  }, 0)

  return blogs.length === 0 ? 0 : likesReduced
}

module.exports = {
  dummy,
  totalLikes,
}

const fs = require('fs')
const marked = require('./marked')

const LINKED_MARKDOWN_RE = /<script[^>]*>([^]*)<\/script>([^]*)$/

const fsAsync = new Proxy({}, {
  get: function (target, key, receiver) {
    if (key === 'constants') {
      return fs.constants
    }
    return function (...args) {
      return new Promise((resolve, reject) => {
        fs[key](...args, (error, value) => {
          if (error) {
            reject(error)
          } else {
            resolve(value)
          }
        })
      })
    }
  }
})

class MarkFile {
  constructor ({
    name,
    path,
    content,
    linked,
    output
  } = {}) {
    this.name = name
    this.path = path
    this.content = content
    this.linked = linked
    this.output = output
  }
}

class MarkFold {
  constructor ({
    name,
    path,
    files
  }) {
    this.name = name
    this.path = path
    this.files = files
  }
}

function markContent (raw) {
  const matches = raw.match(LINKED_MARKDOWN_RE)
  const linked = JSON.parse(matches[1])
  const output = marked(matches[2])
  return {linked, output}
}

async function markAFile (path) {
  const content = await fsAsync.readFile(path, 'utf8')
  let markedContent = ''
  try {
    markedContent = markContent(content)
  } catch (error) {
    console.error('Error when marking file: ', path)
    throw error
  }
  const {linked, output} = markContent(content)
  const file = new MarkFile({
    path,
    content,
    linked,
    output
  })
  return file
}

async function mark (path = './') {
  const stats = await fsAsync.stat(path)
  if (stats.isDirectory()) {
    const files = await fsAsync.readdir(path)
    const markFiles = await Promise.all(files.map(markAFile))
    const fold = new MarkFold({
      path,
      files: markFiles
    })
    return fold
  } else {
    const file = await markAFile(path)
    return file
  }
}

module.exports = mark

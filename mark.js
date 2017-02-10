const marked = require('./marked')

const LINKED_MARKDOWN_RE = /^\W*<script[^>]*>([^]*?)<\/script>([^]*)$/

class MarkedPair {
  constructor ({
    linked,
    content
  } = {}) {
    this.linked = linked
    this.content = content
  }

  get output () {
    return `<script type="application/ld+json">
${JSON.stringify(this.linked, null, 2)}
</script>

${this.content}`
  }
}

function mark (source) {
  const matches = source.match(LINKED_MARKDOWN_RE)
  const linked = JSON.parse(matches[1])
  const content = marked(matches[2])
  const markedPair = new MarkedPair({linked, content})
  return markedPair
}

module.exports = mark

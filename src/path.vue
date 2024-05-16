<script>
export default {
  name: 'PathComponent',
  props: {
    path: {
      type: Array,
      required: true
    }
  },
  methods: {
    size() {
      return this.path.length;
    },
    head() {
      return this.path.slice(0, 2);
    },
    tail() {
      return new PathComponent({ path: this.path.slice(2) });
    },
    init() {
      return new PathComponent({ path: this.path.slice(0, -2) });
    },
    last() {
      return this.path.slice(-2);
    },
    empty() {
      return this.path.length === 0;
    },
    contains(otherPath) {
      return this.path.join('').startsWith(otherPath.join(''));
    },
    isChildOf(parentPath) {
      return this.init().join('') === parentPath.join('');
    },
    append(id) {
      this.path.push(id);
    },
    equals(otherPath) {
      return JSON.stringify(this.path) === JSON.stringify(otherPath);
    },
    moveInDirection(direction, startingElement) {
      if (!this.path.includes(startingElement)) {
        console.error('Error: Starting element is not part of the path list.');
        return;
      }

      let currentIndex = this.path.indexOf(startingElement);

      switch (direction) {
        case 'forward':
          currentIndex = (currentIndex + 1) % this.path.length;
          break;
        case 'backward':
          currentIndex = (currentIndex - 1 + this.path.length) % this.path.length;
          break;
        case 'middleToEnd':
          this.path = this.path.slice(currentIndex + 1);
          return;
        case 'middleToBeginning':
          this.path = this.path.slice(0, currentIndex).reverse();
          return;
        default:
          console.error('Error: Invalid direction.');
          return;
      }

      console.log('New position:', this.path[currentIndex]);
    }
  },
  created() {
    // Set root path when the component is created
    this.path = [];
  }
};
</script>

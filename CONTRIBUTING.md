# Contributing to RESTless

Thank you for considering contributing to RESTless! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Be patient and welcoming
- Be thoughtful
- Be collaborative
- When disagreeing, try to understand why

## How to Contribute

### Reporting Bugs

Before submitting a bug report:

1. Check the [GitHub Issues](https://github.com/devalexanderdaza/RESTless/issues) to see if the problem has already been reported
2. Ensure the bug is related to the RESTless project

When submitting a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots or GIFs if applicable
- Browser and OS information
- Any additional context that might help

### Suggesting Features

Feature suggestions are welcome! To suggest a feature:

1. Check if the feature has already been suggested or implemented
2. Submit a GitHub issue with the tag "enhancement"
3. Provide a clear description of the feature and why it would be valuable

### Development Process

#### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/RESTless.git`
3. Navigate to the project directory: `cd RESTless`
4. Install dependencies: `npm install`
5. Start the development server: `npm run dev`

#### Branching Strategy

- `main` - stable production code
- `development` - development branch for integrating features
- Feature branches should be created from `development` and named following this convention:
  - `feature/feature-name`
  - `bugfix/bug-name`
  - `docs/documentation-change`

#### Pull Request Process

1. Create a new branch from `development`
2. Make your changes
3. Run tests: `npm test`
4. Update documentation if necessary
5. Submit a pull request to the `development` branch
6. Describe your changes in detail
7. Reference any related issues

#### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `perf:` - A code change that improves performance
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools

Example: `feat: add user authentication component`

### Coding Standards

- Follow the TypeScript coding style outlined in the `.eslintrc` configuration
- Write comprehensive comments for complex functionality
- Prioritize readability and maintainability
- Write self-documenting code when possible
- Add JSDoc comments for public APIs

### Testing

All new features and bug fixes should include appropriate tests:

- Write tests for new functionality
- Ensure existing tests continue to pass
- Aim for high test coverage

To run tests:
```bash
npm test
```

### Documentation

Documentation is crucial for this project:

- Document all new features and APIs
- Update existing documentation as needed
- Use clear, concise language
- Include examples where appropriate

## Release Process

1. The maintainers will periodically review pull requests
2. Accepted changes will be merged into `dev`
3. When ready for release, `development` will be merged into `main`
4. A new version will be tagged according to [Semantic Versioning](https://semver.org/)

## Getting Help

If you need help with contributing:

- Check the documentation
- Open a GitHub issue with the tag "question"
- Contact the maintainer: dev.alexander.daza@gmail.com

## Acknowledgments

Your contributions are appreciated! All contributors will be acknowledged in the project's README.

---

By contributing, you agree that your contributions will be licensed under the project's MIT License.

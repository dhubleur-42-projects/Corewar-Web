# Shared libraries for the project

This folder contains shared libraries that can be used across different applications in the project. These libraries are designed to encapsulate common functionality, making it easier to maintain and reuse code

## Building Libraries

You need to build all libraries before running the applications. You can do this by running the following command in the root of each library folder:

```bash
pnpm build
```

## Using Libraries

To use a library in your application, you can import it as you would with any other npm package. For example, if you have a library named `my-lib`, you can install it in your application with:

```json
{
	"dependencies": {
		"my-lib": "workspace:*"
	}
}
```

Then, you can import it in your code:

```typescript
import { myFunction } from 'my-lib'
myFunction()
```

## Modifying Libraries

If you need to modify a library, you can do so directly in the library's folder. After making changes, make sure to rebuild the library. You can run `pnpm watch` in the library folder to automatically rebuild the library whenever you make changes

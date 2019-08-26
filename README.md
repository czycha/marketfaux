# Marketfaux

For when you want to use Marketo forms, but not its API.

## Why not use Marketo's Forms API?

Marketo's Forms API is opinionated in terms of style and behavior. In some cases, those opinions are terrible and outdated. Additionally, sometimes you just want to break the mold and do something that would not normally be possible, such as utilizing a JavaScript framework like React.

## What Marketfaux does (and what it doesn't do)

Marketfaux just provides functions to send data as if you've filled out a standard Marketo form. That way, you can implement the form the way you want and still have your form's results passed on to Marketo.

Marketfaux, however, is not a drop-in replacement for the Marketo Forms API. It does not generate the form's HTML or validate input—those bits will have to be implemented by *you*.

## API

### Return type

Marketfaux uses [Wretch](https://github.com/elbywan/wretch) to send requests using the Fetch API. Please see their documentation to learn more about [error handling](https://github.com/elbywan/wretch#catchers) and [responses](https://github.com/elbywan/wretch#response-types).

All functions return Wretch's `ResponseChain` type.

### Base URL, Munchkin ID, and form ID

The first three parameters for each function are the same as in Marketo's `loadForm` function:
1. Base URL (ex. `"//app-sjqe.marketo.com"`)
2. Munchkin ID (ex. `"718-GIV-198"`)
3. Form ID (ex. `621`)

### Functions

#### sendForm(baseUrl: string, munchkinId: string, formId: string | number, form: HTMLFormElement | string): ResponseChain

Bundle up the data from a `<form />` element and submit it. Accepts either the element itself or a query selector for the element.

##### Examples

```js
Marketfaux.sendForm("//app-sjqe.marketo.com", "718-GIV-198", 621, "form#my-id")
```

```js
Marketfaux.sendForm("//app-sjqe.marketo.com", "718-GIV-198", 621, document.querySelector("form#my-id"))
```

#### sendData(baseUrl: string, munchkinId: string, formId: string | number, form: FormData | Record<string, any>): ResponseChain

Sends provided data which can either be a [`FormData`](https://developer.mozilla.org/en/docs/Web/API/FormData) object or a standard key-value object.

##### Bracketization

Marketfaux will automatically bracketize keys with multiple values to conform to PHP's naming conventions. If those keys already have bracket notation, they will not be bracketized.

###### Input
```json
{
  "key": ["value1", "value2"]
}
```

###### Output
```yaml
key[]: value1
key[]: value2
```

##### Examples

```js
Marketfaux.sendData("//app-sjqe.marketo.com", "718-GIV-198", 621, { key1: "value1", key2: "value2" })
```

```js
const data = new FormData()
data.append('key1', 'value1')
data.append('key2', 'value2')

Marketfaux.sendData("//app-sjqe.marketo.com", "718-GIV-198", 621, data)
```

#### send(baseUrl: string, munchkinId: string, formId: string | number, payload: HTMLFormElement | string | FormData | Record<string, any>): ResponseChain

Convenience method that will automatically use either `sendForm` or `sendData` based on the type of the provided payload.

## Examples

### On the page

```html
<form id="my-form">
  ...
</form>

<script src="/path/to/marketfaux.min.js"></script>
<script>
  var form = document.getElementById('my-form');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    Marketfaux.send("//app-sjqe.marketo.com", "718-GIV-198", 621, form)
      .badRequest(function () {
        // Handle 400 error
      })
      .timeout(function () {
        // Handle 408 error
      })
      .internalError(function () {
        // Handle 500 error
      })
      .json(function (result) {
        // Handle success
      })
  })
</script>
```

### In an app

```js
import { send } from 'marketfaux'

const formData = {
  // Key-value object
}

send("//app-sjqe.marketo.com", "718-GIV-198", 621, formData)
  .badRequest(() => {
    // Handle 400 error
  })
  .timeout(() => {
    // Handle 408 error
  })
  .internalError(() => {
    // Handle 500 error
  })
  .json((result) => {
    // Handle success
  })
```

## What type of errors should I expect?

Marketo is surprisingly loose when it comes to the data submitted to it.

It ***will*** throw errors if:
- your base URL, Munchkin ID, or form ID is invalid
  - 400 Bad Request error
- there are connectivity issues such as user being offline or Marketo being unreachable

It will ***not*** throw errors if you submit:
- an incompatible value (such as a random string when something in date format is expected)
  - The value for this field will stay as it was before submitting
- non-existent fields
  - Nothing happens
- real fields that are not added to the form
  - Populates that field with the provided value
- without required fields
  - Skips those fields

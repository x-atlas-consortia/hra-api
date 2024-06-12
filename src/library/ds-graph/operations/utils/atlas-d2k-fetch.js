// Adapted from https://github.com/informatics-isi-edu/atlas-d2k-py/blob/main/docs/user-docs/accessing-ermrest.md
/**
 * a simple GET request to demonstrate how you can use pagination to grab all the data in muliple requests.
 *
 * Assume we have n rows, and due to performance concerns, we want to to limit the request to only pageLimit rows.
 * This function will first ask for pageLimit+1 results. If we get less than the requested number of rows, we're done.
 * But if we actually get pageLimit+1 records, there might actually be more. So we're going to ask for the next page of results.
 *
 * Notes:
 * - In ermrest the sort and page criteria must be referring to the same columns. In this simple example
 *   we're always sorting values by the RID column. so you have to make sure RID is one of the projected columns.
 *   feel free to adjust this for other cases.
 * - In this example I'm using fetch which will not use any cookies. So it will only fetch publicly available data.
 *   If you want to get all the available data, you need to find the cookie of a user with proper access and use
 *   that for this request. In our internal test framework, we do this by manually setting the `webauthn` cookie.
 *
 * @param {string} url
 * @param {number} pageLimit
 * @param {string?} afterRIDValue
 * @returns {Promise<object[]>} array of items fetched
 */
export async function fetchAllRows(url, pageLimit, afterRIDValue) {
  try {
    let usedURL = url + '@sort(RID)';
    if (afterRIDValue) {
      usedURL += `@after(${afterRIDValue})`;
    }
    // ask for one more row
    usedURL += '?limit=' + (pageLimit + 1);

    const response = await fetch(usedURL);

    if (response.status !== 200) {
      console.error('did not recieve a 200 response');
      console.log(await response.text());
      return [];
    }

    let responseRows = await response.json();
    if (responseRows.length > pageLimit) {
      // remove the extra item that we recieved
      responseRows.pop();
      const lastRowRID = responseRows[responseRows.length - 1].RID;

      // go for the next page
      const nextRows = await fetchAllRows(url, pageLimit, lastRowRID);
      // append the current page of results with the other ones.
      return responseRows.concat(nextRows);
    } else {
      return responseRows;
    }
  } catch (err) {
    console.error('error while fetching data');
    console.log(err);
    return [];
  }
}

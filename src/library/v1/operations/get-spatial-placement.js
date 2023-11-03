/**
 * Create an Express route handler that generates spatial placement information for a given target.
 * This information includes the source, target, placement date, translation, rotation, and scaling data.
 *
 * @param {Object} req - The Express request object containing the target_iri and rui_location in the request body.
 * @param {Object} res - The Express response object used to send the generated spatial placement JSON.
 * @param {function} _next - The Express next middleware function (not used in this context).
 */
export function getSpatialPlacement() {
  return async (req, res, _next) => {
    const { target_iri, rui_location } = req.body;
    const targetIri = target_iri || undefined;

    if (!targetIri) {
      res.status(404).send("Must provide a target_iri in the request body");
      return;
    }
    if (!rui_location) {
      res.status(404).send("Must provide a rui_location in the request body");
      return;
    }
    const result = {
      "@context":
        "https://hubmapconsortium.github.io/hubmap-ontology/ccf-context.jsonld",
      "@id": rui_location["@id"] + "-placement-from-ccf-api",
      source: rui_location["@id"],
      target: targetIri,
      "@type": "Sample",
      placement_date: new Date().toDateString(),
      x_translation: 0,
      y_translation: 0,
      z_translation: 0,
      translation_units: "millimeters",
      x_rotation: 0,
      y_rotation: 0,
      z_rotation: 0,
      rotation_units: "degree",
      x_scaling: 0,
      y_scaling: 0,
      z_scaling: 0,
      scaling_units: "ratio",
    };
    return res.json(result);
  };
}

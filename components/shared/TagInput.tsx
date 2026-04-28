/*
  TAG INPUT — lets users type and add multiple short tags.

  Props:
  - value         : string[] — current list of tags
  - onChange      : called with updated string[] when tags change
  - maxTags       : maximum number of tags allowed
  - maxTagLength  : maximum characters per tag
  - placeholder   : hint text shown in the input

  Behavior:
  - User types a tag and presses Enter or comma → tag is added
  - If tag already exists or is too long → ignore
  - If maxTags reached → disable input
  - Each tag shown as a chip with an X button to remove it

  Used for: room features, teacher certifications.
*/

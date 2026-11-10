# Railway Signalling-Plan Digitisation & Editing

> Employer project: client names, internal names, screenshots and code are omitted. Visuals are recreated illustrations.

## The problem

Scheme drawings had to become structured, editable signalling plans: digitised into JSON, with railway assets (signals, track circuits, aspect control charts) rendered and edited directly on the drawing.

## Approach

Built on top of the [custom CAD viewer/editor](/work/custom-cad-editor):

- DXF graphics and JSON domain data in one editor, with links between drawing entities and domain assets
- add, edit and delete railway assets on the CAD canvas
- plan digitisation and generation
- red/green change detection between plan versions
- search and navigation across the plan

## Tech

Three.js · JSON↔DXF · domain modelling · change detection · search & navigation

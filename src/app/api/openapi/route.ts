// API-ს აღწერა OpenAPI ფორმატში. ამ აღწერიდან /docs გვერდზე Swagger
// აწყობს დოკუმენტაციას, სადაც API-ს გამოცდაც შეიძლება
const apiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'medical.ge API',
    description: 'medical.ge-ის ანგარიშების, კლინიკებისა და ადმინისტრირების API.',
    version: '1.0.0',
  },
  servers: [{ url: '/', description: 'მიმდინარე სერვერი' }],
  tags: [
    { name: 'ავტორიზაცია' },
    { name: 'კლინიკები' },
    { name: 'ადმინისტრირება' },
  ],
  components: {
    // ავტორიზაცია: სესიის cookie, რომელსაც შესვლისას better-auth აყენებს
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'ავტორიზაციის სესიის cookie. ჯერ შედით ანგარიშში იმავე ბრაუზერიდან.',
      },
    },
    // მონაცემების ფორმები, რომლებზეც ქვემოთ $ref-ით ვმიუთითებთ
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      DoctorInput: {
        type: 'object',
        required: ['name', 'specialty', 'experienceYears'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'არსებული ექიმის განახლებისას სავალდებულოა.' },
          name: { type: 'string', minLength: 1 },
          specialty: { type: 'string', minLength: 1 },
          experienceYears: { type: 'integer', minimum: 0 },
        },
      },
      ClinicInput: {
        type: 'object',
        required: ['name', 'city', 'address', 'phone', 'specialty', 'imageUrl', 'doctors'],
        properties: {
          name: { type: 'string', minLength: 1 },
          city: { type: 'string', minLength: 1 },
          address: { type: 'string', minLength: 1 },
          phone: { type: 'string', minLength: 1 },
          specialty: { type: 'string', minLength: 1 },
          imageUrl: { type: 'string', description: 'არასავალდებულო სურათის ბმული. თუ არ გაქვთ, დატოვეთ ცარიელი.' },
          doctors: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/DoctorInput' },
          },
        },
      },
      Message: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
    },
  },
  // თითოეული მისამართი: რა მეთოდით, რა მონაცემით და რა პასუხებს აბრუნებს
  paths: {
    '/api/auth/sign-up/email': {
      post: {
        tags: ['ავტორიზაცია'],
        summary: 'პაციენტის ან კლინიკის ანგარიშის შექმნა',
        description: 'თუ მოთხოვნას უკვე აქვს ავტორიზებული სესია, ანგარიშის შექმნა უარყოფილი იქნება.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'accountType'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  accountType: { type: 'string', enum: ['PATIENT', 'CLINIC'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'ანგარიში შეიქმნა.' },
          '403': { description: 'ახალი ანგარიშის შესაქმნელად ჯერ გამოდით სისტემიდან.' },
        },
      },
    },
    '/api/auth/sign-in/email': {
      post: {
        tags: ['ავტორიზაცია'],
        summary: 'შესვლა ელფოსტითა და პაროლით',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  rememberMe: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'შესვლა წარმატებულია; შეიქმნა სესიის cookie.' },
          '401': { description: 'ელფოსტა ან პაროლი არასწორია.' },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['ავტორიზაცია'],
        summary: 'სისტემიდან გამოსვლა',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': { description: 'სისტემიდან გამოხვედით.' },
          '401': { description: 'აქტიური სესია ვერ მოიძებნა.' },
        },
      },
    },
    '/api/auth/get-session': {
      get: {
        tags: ['ავტორიზაცია'],
        summary: 'მიმდინარე სესიის მიღება',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': { description: 'მიმდინარე სესია; სისტემიდან გამოსვლისას ბრუნდება null.' },
        },
      },
    },
    '/api/clinic-registration': {
      post: {
        tags: ['კლინიკები'],
        summary: 'კლინიკისა და ექიმების მონაცემების დასამტკიცებლად გაგზავნა',
        description: 'ხელმისაწვდომია ავტორიზებული კლინიკის ანგარიშისთვის. ახალი განაცხადი ადმინისტრატორის დადასტურებას ელოდება.',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClinicInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'კლინიკა დასამტკიცებლად გაიგზავნა.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    clinicId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'კლინიკის მონაცემები არასწორია.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '401': {
            description: 'საჭიროა ანგარიშში შესვლა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '403': {
            description: 'კლინიკის მონაცემების გაგზავნა მხოლოდ კლინიკის ანგარიშს შეუძლია.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
        },
      },
    },
    '/api/admin/clinics/{clinicId}': {
      patch: {
        tags: ['ადმინისტრირება'],
        summary: 'კლინიკისა და მისი ექიმების რედაქტირება',
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: 'clinicId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClinicInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'კლინიკა განახლდა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '400': {
            description: 'კლინიკის მონაცემები არასწორია.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '401': {
            description: 'საჭიროა ანგარიშში შესვლა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '403': {
            description: 'საჭიროა ადმინისტრატორის უფლება.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '404': {
            description: 'კლინიკა ვერ მოიძებნა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '409': {
            description: 'კლინიკის ექიმების სია შეიცვალა. განაახლეთ გვერდი და სცადეთ თავიდან.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
        },
      },
    },
    '/api/admin/clinics/{clinicId}/approve': {
      post: {
        tags: ['ადმინისტრირება'],
        summary: 'კლინიკისა და მისი ექიმების დამტკიცება',
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: 'clinicId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'კლინიკა და მისი ექიმები დამტკიცდა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '401': {
            description: 'საჭიროა ანგარიშში შესვლა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '403': {
            description: 'საჭიროა ადმინისტრატორის უფლება.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
          '404': {
            description: 'კლინიკა ვერ მოიძებნა.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
          },
        },
      },
    },
  },
};

// GET /api/openapi — აღწერას JSON-ად აბრუნებს
export function GET() {
  return Response.json(apiDocument);
}

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET Request
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    emails.forEach(email => {
      const el = document.createElement('div');
      el.classList.add('mailbox-email');
      if(email.read) {
        el.classList.add('read');
      }

      if(mailbox === 'inbox' || mailbox === 'archive') {

        el.innerHTML = `
        <div>
          <span class="mailbox-sender">${email.sender}</span> <span class="mailbox-subject">${email.subject}</span>
        </div>
        <div>
          <span class="mailbox-timestamp">${email.timestamp}</span>
        </div>
        `;
      } else {
        el.innerHTML = `
        <div>
          <span class="mailbox-sender">${email.recipients.toString().split(',').join(', ')}</span> <span class="mailbox-subject">${email.subject}</span>
        </div>
        <div>
          <span class="mailbox-timestamp">${email.timestamp}</span>
        </div>
        `;
      }

      // Append email to the mailbox view
      document.getElementById('emails-view').append(el);
      // Make each email in the mailbox clickable
      el.addEventListener('click', () => load_email(email.id));
    })
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

function send_email() {
  // Preventing from page reloading
  event.preventDefault();

  // Initializing variables
  const recipients = document.getElementById('compose-recipients').value;
  const subject = document.getElementById('compose-subject').value;
  const body = document.getElementById('compose-body').value;

  // POST Request
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    // Load user's sent mailbox
    load_mailbox('sent');
  })
  .catch(error => {
    console.log('Error: ', error);
  });
  
  // Preventing from page reloading
  return false;
}

function load_email(email_id) {
  // Empty email view
  document.querySelector('#email-view').innerHTML = '';

  // Show email view and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // GET Request - Retrieve email's data
  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    
    const el = document.createElement('div');

    el.innerHTML = `
    <p><span class="bold">From:</span> ${email.sender}</p>
    <p><span class="bold">To:</span> ${email.recipients.toString().split(',').join(', ')}</p>
    <p><span class="bold">Subject:</span> ${email.subject}</p>
    <p><span class="bold">Timestamp:</span> ${email.timestamp}</p>
    <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
    `;

    // Adding Archiving option only for Inbox emails
    if(document.querySelector('h2').innerHTML != email.sender) {
      // Adapting the button depending on already archived or not
      if(!email.archived) {
        el.innerHTML += `<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>`;
      } else {
        el.innerHTML += `<button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>`
      }
    }

    el.innerHTML += `
    <hr>
    <pre>${email.body}</pre>
    `;

    // Append email to the email view
    document.getElementById('email-view').append(el);

    // Event Listeners
    document.getElementById('reply').addEventListener('click', () => reply(email));

    if(!email.archived) {
      document.getElementById('archive').addEventListener('click', () => archive(email.id));
    } else {
      document.getElementById('unarchive').addEventListener('click', () => unarchive(email.id));
    }
  })
  .catch(error => {
    console.log('Error: ', error);
  });

  // PUT Request - Mark email as read
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => {
    console.log('Error: ', error)
  });
}

function archive(email_id) {
  // PUT Request
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  .then(load_mailbox('inbox'))
  .catch(error => {
    console.log('Error: ', error);
  });
}

function unarchive(email_id) {
  // PUT Request
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then(load_mailbox('inbox'))
  .catch(error => {
    console.log('Error: ', error);
  });
}

function reply(email) {
  compose_email();

  //Pre-fill composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.includes('Re:')) {
    document.querySelector('#compose-subject').value = email.subject;
  } else {
    document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
  }
  document.querySelector('#compose-body').value = `
  
On ${email.timestamp}, ${email.sender} wrote: 
${email.body}
`;
}